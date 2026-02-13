// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IBiteSupplicant} from "../lib/bite-solidity/contracts/interfaces/IBiteSupplicant.sol";
import {BITE} from "../lib/bite-solidity/contracts/BITE.sol";

/**
 * @title CloakRouter
 * @notice Encrypted payment proxy with policy enforcement using BITE CTX
 * @dev Follows exact pattern from bite-conditional-transactions.md
 */
contract CloakRouter is IBiteSupplicant {
    // ═══════════════════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════════════════

    /// @notice BITE CTX precompile address
    address constant BITE_SUBMIT_CTX = 0x000000000000000000000000000000000000001B;
    
    /// @notice CTX gas payment requirement
    uint256 constant CTX_GAS_PAYMENT = 0.06 ether;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Types
    // ═══════════════════════════════════════════════════════════════════════════════

    struct Policy {
        bytes encryptedLimits;  // Encrypted: [dailyLimit, maxPerTx, allowlist[]]
        uint256 dailySpent;
        uint256 lastResetDay;
        bool exists;
    }

    struct PendingPayment {
        address agent;
        bytes encryptedPayment;  // Encrypted: [recipient, amount, token]
        uint256 timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════════════════════════════

    mapping(address => Policy) public policies;
    mapping(uint256 => PendingPayment) public pendingPayments;
    uint256 public paymentNonce;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════════════════════════════

    event PolicySet(address indexed agent, bytes encryptedLimits);
    event PaymentSubmitted(address indexed agent, uint256 indexed nonce);
    event PaymentExecuted(address indexed agent, address indexed recipient, uint256 amount, address token);
    event PaymentRejected(address indexed agent, address indexed recipient, uint256 amount, string reason);

    // ═══════════════════════════════════════════════════════════════════════════════
    // Errors
    // ═══════════════════════════════════════════════════════════════════════════════

    error NoPolicySet();
    error InsufficientCTXPayment();
    error CTXSubmissionFailed();
    error OnlyBITE();
    error TransferFailed();

    // ═══════════════════════════════════════════════════════════════════════════════
    // External Functions
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set encrypted policy for agent
     * @param encryptedLimits Encrypted bytes: [dailyLimit, maxPerTx, allowlist[]]
     */
    function setPolicy(bytes calldata encryptedLimits) external {
        policies[msg.sender] = Policy({
            encryptedLimits: encryptedLimits,
            dailySpent: 0,
            lastResetDay: block.timestamp / 1 days,
            exists: true
        });

        emit PolicySet(msg.sender, encryptedLimits);
    }

    /**
     * @notice Request payment with encrypted details (triggers CTX)
     * @param encryptedPayment Encrypted bytes: [recipient, amount, token]
     */
    function requestPayment(bytes calldata encryptedPayment) external payable {
        if (!policies[msg.sender].exists) revert NoPolicySet();
        if (msg.value < CTX_GAS_PAYMENT) revert InsufficientCTXPayment();

        Policy storage policy = policies[msg.sender];

        // Reset daily counter if new day
        uint256 today = block.timestamp / 1 days;
        if (today > policy.lastResetDay) {
            policy.dailySpent = 0;
            policy.lastResetDay = today;
        }

        // Store pending payment
        uint256 nonce = ++paymentNonce;
        pendingPayments[nonce] = PendingPayment({
            agent: msg.sender,
            encryptedPayment: encryptedPayment,
            timestamp: block.timestamp
        });

        // Prepare encrypted arguments (will be decrypted by consensus)
        bytes[] memory encryptedArgs = new bytes[](2);
        encryptedArgs[0] = encryptedPayment;           // [recipient, amount, token]
        encryptedArgs[1] = policy.encryptedLimits;     // [dailyLimit, maxPerTx, allowlist]

        // Prepare plaintext arguments (passed as-is)
        bytes[] memory plaintextArgs = new bytes[](3);
        plaintextArgs[0] = abi.encode(nonce);
        plaintextArgs[1] = abi.encode(msg.sender);
        plaintextArgs[2] = abi.encode(policy.dailySpent);

        // Use BITE library's submitCTX function
        address payable ctxSender = BITE.submitCTX(
            BITE_SUBMIT_CTX,
            2_500_000,
            encryptedArgs,
            plaintextArgs
        );

        // Top up CTX sender with gas payment
        (bool success, ) = ctxSender.call{ value: msg.value }("");
        if (!success) revert CTXSubmissionFailed();

        emit PaymentSubmitted(msg.sender, nonce);
    }

    /**
     * @notice BITE callback after decryption (Block N+1)
     * @param decryptedArguments Decrypted data arrays
     * @param plaintextArguments Plaintext data arrays
     */
    function onDecrypt(
        bytes[] calldata decryptedArguments,
        bytes[] calldata plaintextArguments
    ) external override {
        if (msg.sender != BITE_SUBMIT_CTX) revert OnlyBITE();

        // Decode plaintext arguments: [nonce, agent, currentDailySpent]
        uint256 nonce = abi.decode(plaintextArguments[0], (uint256));
        address agent = abi.decode(plaintextArguments[1], (address));
        uint256 currentDailySpent = abi.decode(plaintextArguments[2], (uint256));

        // Decode decrypted arguments: [payment, policy]
        bytes memory paymentData = decryptedArguments[0];
        bytes memory policyData = decryptedArguments[1];

        // Decode decrypted payment: [recipient, amount, token]
        (address recipient, uint256 amount, address token) = 
            abi.decode(paymentData, (address, uint256, address));

        // Decode decrypted policy: [dailyLimit, maxPerTx, allowlist[]]
        (uint256 dailyLimit, uint256 maxPerTx, address[] memory allowlist) =
            abi.decode(policyData, (uint256, uint256, address[]));

        // Check allowlist
        bool inAllowlist = false;
        for (uint256 i = 0; i < allowlist.length; i++) {
            if (allowlist[i] == recipient) {
                inAllowlist = true;
                break;
            }
        }

        if (!inAllowlist) {
            emit PaymentRejected(agent, recipient, amount, "Not in allowlist");
            return;
        }

        if (amount > maxPerTx) {
            emit PaymentRejected(agent, recipient, amount, "Exceeds max per transaction");
            return;
        }

        if (currentDailySpent + amount > dailyLimit) {
            emit PaymentRejected(agent, recipient, amount, "Exceeds daily limit");
            return;
        }

        // Execute payment
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                agent,
                recipient,
                amount
            )
        );

        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            emit PaymentRejected(agent, recipient, amount, "Transfer failed");
            return;
        }

        // Update daily spent
        policies[agent].dailySpent += amount;

        // Clean up
        delete pendingPayments[nonce];

        emit PaymentExecuted(agent, recipient, amount, token);
    }

    /// @notice Allow contract to receive sFUEL for CTX
    receive() external payable {}
}
