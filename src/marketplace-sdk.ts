import { BITE } from "@skalenetwork/bite";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  parseUnits,
  encodeAbiParameters,
  type Hash,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { skaleChain } from "./chain.js";

export interface MarketplaceConfig {
  rpcUrl: string;
  privateKey: `0x${string}`;
  marketplaceAddress: Address;
}

export interface JobParams {
  description: string;
  budget: bigint;
  deadlineBlocks: number;  // Blocks from now
  paymentToken: Address;
}

export interface BidParams {
  bidAmount: bigint;
  proposedDelivery: number;  // Timestamp
  metadata: string;
}

const MARKETPLACE_ABI = [
  {
    type: "function",
    name: "postJob",
    inputs: [
      { name: "description", type: "string" },
      { name: "budget", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "paymentToken", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitBid",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "encryptedBid", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revealBids",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "completeJob",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getJob",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "jobId", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "description", type: "string" },
          { name: "budget", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "paymentToken", type: "address" },
          { name: "status", type: "uint8" },
          { name: "winner", type: "address" },
          { name: "winningBid", type: "uint256" },
          { name: "fundsLocked", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBidCount",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "JobPosted",
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "requester", type: "address" },
      { indexed: false, name: "budget", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "WinnerSelected",
    inputs: [
      { indexed: true, name: "jobId", type: "uint256" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "winningBid", type: "uint256" },
    ],
  },
] as const;

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export class AgentMarketplaceSDK {
  private bite: BITE;
  private wallet: any;
  private publicClient: any;
  private account: any;
  private marketplaceAddress: Address;

  constructor(config: MarketplaceConfig) {
    this.bite = new BITE(config.rpcUrl);
    this.account = privateKeyToAccount(config.privateKey);
    this.marketplaceAddress = config.marketplaceAddress;

    this.wallet = createWalletClient({
      account: this.account,
      chain: { ...skaleChain, fees: undefined },
      transport: http(config.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: skaleChain,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Post a job with locked payment
   */
  async postJob(params: JobParams): Promise<{ jobId: bigint; txHash: Hash }> {
    // Approve marketplace to spend tokens
    await this.approveToken(params.paymentToken, params.budget);

    // Calculate deadline block
    const currentBlock = await this.publicClient.getBlockNumber();
    const deadline = currentBlock + BigInt(params.deadlineBlocks);

    // Post job
    const hash = await this.wallet.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "postJob",
      args: [params.description, params.budget, deadline, params.paymentToken],
      gasPrice: 100000n,
    });

    // Wait for confirmation and get jobId from event
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    
    // Find JobPosted event
    const jobPostedEvent = receipt.logs.find((log: any) => {
      try {
        const decoded = this.publicClient.decodeEventLog({
          abi: MARKETPLACE_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === "JobPosted";
      } catch {
        return false;
      }
    });

    const jobId = jobPostedEvent ? (jobPostedEvent as any).args.jobId : 1n;

    return { jobId, txHash: hash };
  }

  /**
   * Submit encrypted bid for a job
   */
  async submitBid(jobId: bigint, bid: BidParams): Promise<Hash> {
    // Encode bid: [bidAmount, proposedDelivery, metadata]
    const encodedBid = encodeAbiParameters(
      [
        { name: "bidAmount", type: "uint256" },
        { name: "proposedDelivery", type: "uint256" },
        { name: "metadata", type: "string" },
      ],
      [bid.bidAmount, BigInt(bid.proposedDelivery), bid.metadata]
    );

    // Encrypt using BITE
    const encryptedBid = await this.bite.encryptMessage(encodedBid);

    // Submit bid
    const hash = await this.wallet.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "submitBid",
      args: [jobId, encryptedBid as `0x${string}`],
      gasPrice: 100000n,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Trigger bid reveal via CTX (after deadline)
   */
  async revealBids(jobId: bigint): Promise<Hash> {
    const hash = await this.wallet.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "revealBids",
      args: [jobId],
      value: parseUnits("0.06", 18), // CTX payment
      gasPrice: 100000n,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Complete job and release payment (winner only)
   */
  async completeJob(jobId: bigint): Promise<Hash> {
    const hash = await this.wallet.writeContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "completeJob",
      args: [jobId],
      gasPrice: 100000n,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  /**
   * Get job details
   */
  async getJob(jobId: bigint) {
    return await this.publicClient.readContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "getJob",
      args: [jobId],
    });
  }

  /**
   * Get bid count for a job
   */
  async getBidCount(jobId: bigint): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "getBidCount",
      args: [jobId],
    });
  }

  /**
   * Watch for winner selection
   */
  watchWinnerSelected(
    callback: (jobId: bigint, winner: Address, winningBid: bigint) => void
  ) {
    this.publicClient.watchEvent({
      address: this.marketplaceAddress,
      event: parseAbiItem(
        "event WinnerSelected(uint256 indexed jobId, address indexed winner, uint256 winningBid)"
      ),
      onLogs: (logs: any[]) => {
        for (const log of logs) {
          callback(log.args.jobId, log.args.winner, log.args.winningBid);
        }
      },
    });
  }

  getAddress(): Address {
    return this.account.address;
  }

  private async approveToken(token: Address, amount: bigint): Promise<void> {
    const hash = await this.wallet.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [this.marketplaceAddress, amount],
      gasPrice: 100000n,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
  }
}

export function createMarketplace(config: MarketplaceConfig) {
  return new AgentMarketplaceSDK(config);
}
