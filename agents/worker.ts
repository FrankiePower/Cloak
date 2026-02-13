import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Bite } from "@skalenetwork/bite";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Agent configuration type
interface AgentConfig {
  name: string;
  id: string;
  avatar: string;
  color: string;
  description: string;
  strategy: string;
  traits: {
    speed: number;
    quality: number;
    cost: number;
  };
  bidding: {
    pricingModel: string;
    baseMultiplier: number;
    deliveryTime: string;
    specialization: string[];
  };
  metadata: {
    reputation: number;
    completedJobs: number;
    avgDeliveryTime: string;
  };
}

// Marketplace ABI (minimal for reading jobs)
const MARKETPLACE_ABI = [
  {
    name: "jobs",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
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
  {
    name: "jobCounter",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "submitBid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "encryptedBid", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

// Custom chain config for BITE V2 Sandbox
const biteV2Sandbox = {
  id: 103698795,
  name: "BITE V2 Sandbox",
  nativeCurrency: { name: "sFUEL", symbol: "sFUEL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
    public: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
};

class AutoBiddingAgent {
  private config: AgentConfig;
  private publicClient;
  private walletClient;
  private bite: Bite;
  private marketplaceAddress: `0x${string}`;
  private processedJobs: Set<number> = new Set();

  constructor(configPath: string, privateKey: `0x${string}`) {
    // Load agent config
    this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Setup clients
    const account = privateKeyToAccount(privateKey);

    this.publicClient = createPublicClient({
      chain: biteV2Sandbox,
      transport: http(),
    });

    this.walletClient = createWalletClient({
      chain: biteV2Sandbox,
      transport: http(),
      account,
    });

    this.bite = new Bite(biteV2Sandbox.rpcUrls.default.http[0]);
    this.marketplaceAddress = process.env.AGENT_MARKETPLACE_ADDRESS as `0x${string}`;

    console.log(`[${this.config.name}] ${this.config.avatar} Agent initialized`);
    console.log(`  Strategy: ${this.config.strategy}`);
    console.log(`  Pricing: ${this.config.bidding.pricingModel} (${this.config.bidding.baseMultiplier}x)`);
  }

  // Calculate bid based on job budget and agent strategy
  private calculateBid(budget: bigint): bigint {
    const budgetNumber = Number(formatUnits(budget, 6)); // USDC has 6 decimals
    const multiplier = this.config.bidding.baseMultiplier;

    // Add randomness ±10%
    const randomFactor = 0.9 + Math.random() * 0.2;
    const bidAmount = budgetNumber * multiplier * randomFactor;

    // Ensure bid is below budget
    const finalBid = Math.min(bidAmount, budgetNumber * 0.95);

    return parseUnits(finalBid.toFixed(6), 6);
  }

  // Generate bid metadata
  private generateBidMetadata(): string {
    return JSON.stringify({
      agent: this.config.name,
      deliveryTime: this.config.bidding.deliveryTime,
      quality: this.config.traits.quality,
      reputation: this.config.metadata.reputation,
      specialization: this.config.bidding.specialization,
    });
  }

  // Submit encrypted bid for a job
  private async submitBid(jobId: number, budget: bigint, deadline: bigint) {
    try {
      const currentBlock = await this.publicClient.getBlockNumber();

      // Check if deadline passed
      if (currentBlock >= deadline) {
        console.log(`[${this.config.name}] Job #${jobId} deadline passed, skipping`);
        return;
      }

      // Calculate bid
      const bidAmount = this.calculateBid(budget);
      const proposedDelivery = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
      const metadata = this.generateBidMetadata();

      console.log(`[${this.config.name}] Calculating bid for job #${jobId}`);
      console.log(`  Budget: ${formatUnits(budget, 6)} USDC`);
      console.log(`  My Bid: ${formatUnits(bidAmount, 6)} USDC`);

      // Encode bid data: [bidAmount, proposedDelivery, metadata]
      const encodedBid = `0x${Buffer.concat([
        Buffer.from(bidAmount.toString(16).padStart(64, "0"), "hex"),
        Buffer.from(proposedDelivery.toString(16).padStart(64, "0"), "hex"),
        Buffer.from(metadata.padEnd(64, "\0")),
      ]).toString("hex")}`;

      // Encrypt using BITE
      console.log(`[${this.config.name}] Encrypting bid with BITE...`);
      const encryptedBid = await this.bite.encryptMessage(encodedBid as `0x${string}`);

      // Submit to marketplace
      console.log(`[${this.config.name}] Submitting encrypted bid...`);
      const hash = await this.walletClient.writeContract({
        address: this.marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: "submitBid",
        args: [BigInt(jobId), encryptedBid],
        gasPrice: 100000n, // Legacy transaction for SKALE
      });

      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`[${this.config.name}] ✅ Bid submitted for job #${jobId}`);
      console.log(`  TX: ${hash}`);

      this.processedJobs.add(jobId);
    } catch (error) {
      console.error(`[${this.config.name}] Error submitting bid:`, error);
    }
  }

  // Monitor for new jobs
  async start() {
    console.log(`[${this.config.name}] 🚀 Starting job monitor...`);

    setInterval(async () => {
      try {
        // Get total job count
        const jobCounter = await this.publicClient.readContract({
          address: this.marketplaceAddress,
          abi: MARKETPLACE_ABI,
          functionName: "jobCounter",
        });

        // Check each job
        for (let jobId = 1; jobId <= Number(jobCounter); jobId++) {
          if (this.processedJobs.has(jobId)) continue;

          const job = await this.publicClient.readContract({
            address: this.marketplaceAddress,
            abi: MARKETPLACE_ABI,
            functionName: "jobs",
            args: [BigInt(jobId)],
          });

          const [
            ,
            ,
            description,
            budget,
            deadline,
            ,
            status,
            ,
            ,
            fundsLocked,
          ] = job;

          // Job status: 0 = Open, 1 = BidsRevealed, 2 = Completed, 3 = Cancelled
          if (status === 0 && fundsLocked) {
            console.log(`[${this.config.name}] 📋 New job found: #${jobId}`);
            console.log(`  Description: ${description}`);
            await this.submitBid(jobId, budget, deadline);
          }
        }
      } catch (error) {
        console.error(`[${this.config.name}] Error monitoring jobs:`, error);
      }
    }, 10000); // Check every 10 seconds
  }
}

// Main execution
async function main() {
  const agentType = process.argv[2] || "budget";
  const configPath = path.join(__dirname, `${agentType}-agent.json`);

  if (!fs.existsSync(configPath)) {
    console.error(`Agent config not found: ${configPath}`);
    console.error("Usage: tsx agents/worker.ts [fast|quality|budget]");
    process.exit(1);
  }

  // Each agent needs its own private key
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const agent = new AutoBiddingAgent(configPath, privateKey);
  await agent.start();

  // Keep process running
  process.on("SIGINT", () => {
    console.log("\nShutting down agent...");
    process.exit(0);
  });
}

main().catch(console.error);
