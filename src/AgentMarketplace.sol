// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IBiteSupplicant} from "../lib/bite-solidity/contracts/interfaces/IBiteSupplicant.sol";
import {BITE} from "../lib/bite-solidity/contracts/BITE.sol";

/**
 * @title AgentMarketplace
 * @notice Sealed-bid marketplace for AI agent task auctions using BITE CTX
 * @dev Agents submit encrypted bids, revealed simultaneously at deadline
 */
contract AgentMarketplace is IBiteSupplicant {
    // ═══════════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════════

    address constant BITE_SUBMIT_CTX = 0x000000000000000000000000000000000000001B;
    uint256 constant CTX_GAS_PAYMENT = 0.06 ether;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Types
    // ═══════════════════════════════════════════════════════════════════════════════

    enum JobStatus { Open, BidsRevealed, Completed, Cancelled }

    struct Job {
        uint256 jobId;
        address requester;
        string description;
        uint256 budget;           // Max payment willing to pay
        uint256 deadline;         // Block number for bid deadline
        address paymentToken;
        JobStatus status;
        address winner;
        uint256 winningBid;
        bool fundsLocked;
    }

    struct Bid {
        address bidder;
        bytes encryptedBid;      // Encrypted: [bidAmount, proposedDelivery, metadata]
        uint256 timestamp;
        bool revealed;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════════════════════════════

    uint256 public jobCounter;
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Bid[]) public jobBids;           // jobId => bids array
    mapping(uint256 => bool) public revealInProgress;   // jobId => revealing

    // ═══════════════════════════════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════════════════════════════

    event JobPosted(uint256 indexed jobId, address indexed requester, uint256 budget, uint256 deadline);
    event BidSubmitted(uint256 indexed jobId, address indexed bidder, uint256 bidIndex);
    event BidsRevealing(uint256 indexed jobId, uint256 bidCount);
    event WinnerSelected(uint256 indexed jobId, address indexed winner, uint256 winningBid);
    event JobCompleted(uint256 indexed jobId, address indexed winner);
    event RefundIssued(uint256 indexed jobId, address indexed requester, uint256 amount);

    // ═══════════════════════════════════════════════════════════════════════════════
    // Errors
    // ═══════════════════════════════════════════════════════════════════════════════

    error InvalidBudget();
    error InvalidDeadline();
    error JobNotFound();
    error BiddingClosed();
    error DeadlineNotReached();
    error AlreadyRevealed();
    error NoWinner();
    error NotWinner();
    error OnlyBITE();
    error TransferFailed();

    // ═══════════════════════════════════════════════════════════════════════════════
    // External Functions
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Post a job with locked payment
     * @param description Job description
     * @param budget Maximum payment
     * @param deadline Block number for bid deadline
     * @param paymentToken Token address for payment
     */
    function postJob(
        string calldata description,
        uint256 budget,
        uint256 deadline,
        address paymentToken
    ) external returns (uint256 jobId) {
        if (budget == 0) revert InvalidBudget();
        if (deadline <= block.number) revert InvalidDeadline();

        jobId = ++jobCounter;

        jobs[jobId] = Job({
            jobId: jobId,
            requester: msg.sender,
            description: description,
            budget: budget,
            deadline: deadline,
            paymentToken: paymentToken,
            status: JobStatus.Open,
            winner: address(0),
            winningBid: 0,
            fundsLocked: false
        });

        // Lock payment
        (bool success, bytes memory data) = paymentToken.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                budget
            )
        );
        
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }

        jobs[jobId].fundsLocked = true;

        emit JobPosted(jobId, msg.sender, budget, deadline);
    }

    /**
     * @notice Submit encrypted bid for a job
     * @param jobId Job identifier
     * @param encryptedBid Encrypted: [bidAmount, proposedDelivery, metadata]
     */
    function submitBid(uint256 jobId, bytes calldata encryptedBid) external {
        Job storage job = jobs[jobId];
        if (job.jobId == 0) revert JobNotFound();
        if (block.number >= job.deadline) revert BiddingClosed();
        if (job.status != JobStatus.Open) revert BiddingClosed();

        jobBids[jobId].push(Bid({
            bidder: msg.sender,
            encryptedBid: encryptedBid,
            timestamp: block.timestamp,
            revealed: false
        }));

        emit BidSubmitted(jobId, msg.sender, jobBids[jobId].length - 1);
    }

    /**
     * @notice Trigger bid reveal via CTX (callable after deadline)
     * @param jobId Job identifier
     */
    function revealBids(uint256 jobId) external payable {
        Job storage job = jobs[jobId];
        if (job.jobId == 0) revert JobNotFound();
        if (block.number < job.deadline) revert DeadlineNotReached();
        if (revealInProgress[jobId]) revert AlreadyRevealed();
        if (msg.value < CTX_GAS_PAYMENT) revert InvalidBudget();

        Bid[] storage bids = jobBids[jobId];
        if (bids.length == 0) {
            // No bids, refund requester
            _refund(jobId);
            return;
        }

        revealInProgress[jobId] = true;

        // Prepare encrypted arguments (all bids)
        bytes[] memory encryptedArgs = new bytes[](bids.length);
        for (uint256 i = 0; i < bids.length; i++) {
            encryptedArgs[i] = bids[i].encryptedBid;
        }

        // Prepare plaintext arguments (bidder addresses + jobId)
        bytes[] memory plaintextArgs = new bytes[](bids.length + 1);
        plaintextArgs[0] = abi.encode(jobId);
        for (uint256 i = 0; i < bids.length; i++) {
            plaintextArgs[i + 1] = abi.encode(bids[i].bidder);
        }

        // Submit CTX
        address payable ctxSender = BITE.submitCTX(
            BITE_SUBMIT_CTX,
            2_500_000,
            encryptedArgs,
            plaintextArgs
        );

        (bool success, ) = ctxSender.call{ value: msg.value }("");
        if (!success) revert TransferFailed();

        emit BidsRevealing(jobId, bids.length);
    }

    /**
     * @notice BITE callback after bid decryption (Block N+1)
     * @param decryptedArguments Decrypted bids: [[amount, delivery, metadata], ...]
     * @param plaintextArguments Plaintext: [jobId, bidder1, bidder2, ...]
     */
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    ) external override {
        if (msg.sender != BITE_SUBMIT_CTX) revert OnlyBITE();

        // Decode jobId
        uint256 jobId = abi.decode(plaintextArguments[0], (uint256));
        Job storage job = jobs[jobId];

        // Find lowest valid bid
        uint256 lowestBid = type(uint256).max;
        address winner = address(0);

        for (uint256 i = 0; i < decryptedArguments.length; i++) {
            // Decode bid: [bidAmount, proposedDelivery, metadata]
            (uint256 bidAmount, , ) = abi.decode(
                decryptedArguments[i],
                (uint256, uint256, string)
            );

            address bidder = abi.decode(plaintextArguments[i + 1], (address));

            // Check if bid is valid (within budget)
            if (bidAmount <= job.budget && bidAmount < lowestBid) {
                lowestBid = bidAmount;
                winner = bidder;
            }
        }

        // Mark all bids as revealed
        Bid[] storage bids = jobBids[jobId];
        for (uint256 i = 0; i < bids.length; i++) {
            bids[i].revealed = true;
        }

        if (winner == address(0)) {
            // No valid bids, refund requester
            _refund(jobId);
        } else {
            // Set winner and pay immediately
            job.status = JobStatus.Completed;
            job.winner = winner;
            job.winningBid = lowestBid;

            // Pay winner directly in onDecrypt (atomic execution)
            (bool success, bytes memory data) = job.paymentToken.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    winner,
                    lowestBid
                )
            );

            if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
                revert TransferFailed();
            }

            // Refund excess to requester
            uint256 excess = job.budget - lowestBid;
            if (excess > 0) {
                (success, data) = job.paymentToken.call(
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        job.requester,
                        excess
                    )
                );

                if (success) {
                    emit RefundIssued(jobId, job.requester, excess);
                }
            }

            emit WinnerSelected(jobId, winner, lowestBid);
            emit JobCompleted(jobId, winner);
        }
    }

    /**
     * @notice Complete job and release payment (winner calls this)
     * @param jobId Job identifier
     */
    function completeJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.winner != msg.sender) revert NotWinner();
        if (job.status != JobStatus.BidsRevealed) revert JobNotFound();

        job.status = JobStatus.Completed;

        // Pay winner
        (bool success, bytes memory data) = job.paymentToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                job.winner,
                job.winningBid
            )
        );

        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }

        // Refund excess to requester
        uint256 excess = job.budget - job.winningBid;
        if (excess > 0) {
            (success, data) = job.paymentToken.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    job.requester,
                    excess
                )
            );

            if (success) {
                emit RefundIssued(jobId, job.requester, excess);
            }
        }

        emit JobCompleted(jobId, job.winner);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // View Functions
    // ═══════════════════════════════════════════════════════════════════════════════

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getBids(uint256 jobId) external view returns (Bid[] memory) {
        return jobBids[jobId];
    }

    function getBidCount(uint256 jobId) external view returns (uint256) {
        return jobBids[jobId].length;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Internal Functions
    // ═══════════════════════════════════════════════════════════════════════════════

    function _refund(uint256 jobId) internal {
        Job storage job = jobs[jobId];
        job.status = JobStatus.Cancelled;

        (bool success, ) = job.paymentToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                job.requester,
                job.budget
            )
        );

        if (success) {
            emit RefundIssued(jobId, job.requester, job.budget);
        }
    }

    /// @notice Allow contract to receive sFUEL for CTX
    receive() external payable {}
}
