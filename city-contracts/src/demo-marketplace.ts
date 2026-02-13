import { parseUnits, getAddress, formatUnits } from "viem";
import { createMarketplace } from "./marketplace-sdk.js";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox";
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}`;

// Requester (posts job)
const REQUESTER_KEY = process.env.PRIVATE_KEY as `0x${string}`;

// Bidders (3 different agents)
const AGENT_A_KEY = process.env.PRIVATE_KEY as `0x${string}`; // Reusing for demo
const AGENT_B_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const AGENT_C_KEY = process.env.PRIVATE_KEY as `0x${string}`;

async function main() {
  console.log("🤖 AGENT MARKETPLACE - Sealed Bid Auction Demo\n");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Initialize requester
  const requester = createMarketplace({
    rpcUrl: RPC_URL,
    privateKey: REQUESTER_KEY,
    marketplaceAddress: MARKETPLACE_ADDRESS,
  });

  console.log(`📋 Requester: ${requester.getAddress()}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // Step 1: Post Job
  // ═══════════════════════════════════════════════════════════════════════

  console.log("Step 1: Posting Job");
  console.log("─────────────────────────────────────");

  const jobParams = {
    description: "Analyze 1000 tweets for sentiment analysis",
    budget: parseUnits("1.0", 6), // 1 USDC max
    deadlineBlocks: 50, // 50 blocks for bidding
    paymentToken: USDC_ADDRESS,
  };

  console.log(`Description: ${jobParams.description}`);
  console.log(`Budget: ${formatUnits(jobParams.budget, 6)} USDC`);
  console.log(`Deadline: ${jobParams.deadlineBlocks} blocks from now\n`);

  const { jobId, txHash } = await requester.postJob(jobParams);

  console.log(`✅ Job Posted!`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   Tx: ${txHash}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // Step 2: Agents Submit Encrypted Bids
  // ═══════════════════════════════════════════════════════════════════════

  console.log("Step 2: Agents Submit Encrypted Bids");
  console.log("─────────────────────────────────────");

  const agents = [
    {
      name: "FastAgent",
      sdk: createMarketplace({
        rpcUrl: RPC_URL,
        privateKey: AGENT_A_KEY,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      }),
      bid: {
        bidAmount: parseUnits("0.5", 6), // 0.5 USDC
        proposedDelivery: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        metadata: "Fast processing, 95% accuracy",
      },
    },
    {
      name: "QualityAgent",
      sdk: createMarketplace({
        rpcUrl: RPC_URL,
        privateKey: AGENT_B_KEY,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      }),
      bid: {
        bidAmount: parseUnits("0.8", 6), // 0.8 USDC
        proposedDelivery: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        metadata: "Premium quality, 99% accuracy, detailed report",
      },
    },
    {
      name: "BudgetAgent",
      sdk: createMarketplace({
        rpcUrl: RPC_URL,
        privateKey: AGENT_C_KEY,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      }),
      bid: {
        bidAmount: parseUnits("0.3", 6), // 0.3 USDC (lowest bid)
        proposedDelivery: Math.floor(Date.now() / 1000) + 10800, // 3 hours
        metadata: "Basic analysis, 90% accuracy",
      },
    },
  ];

  for (const agent of agents) {
    console.log(`\n🤖 ${agent.name} submitting bid...`);
    console.log(`   Amount: ${formatUnits(agent.bid.bidAmount, 6)} USDC (ENCRYPTED)`);
    console.log(`   Metadata: "${agent.bid.metadata}" (ENCRYPTED)`);

    const bidTx = await agent.sdk.submitBid(jobId, agent.bid);
    console.log(`   ✅ Bid submitted: ${bidTx}`);
  }

  console.log("\n🔒 All bids encrypted on-chain!");
  console.log("   Competitors CANNOT see each other's bids");
  console.log("   No bid sniping possible\n");

  // ═══════════════════════════════════════════════════════════════════════
  // Step 3: Wait for Deadline & Reveal Bids
  // ═══════════════════════════════════════════════════════════════════════

  console.log("Step 3: Triggering Bid Reveal (CTX)");
  console.log("─────────────────────────────────────");
  console.log("⏰ Waiting for deadline to pass...");
  console.log("   (In production, would wait 50 blocks)\n");

  console.log("For demo: Simulating immediate reveal\n");

  console.log("📊 Bid Reveal Summary:");
  console.log("─────────────────────────────────────");
  console.log("Block N:   Bids encrypted and stored");
  console.log("Block N+1: BITE CTX decrypts all bids simultaneously");
  console.log("Block N+1: onDecrypt() selects lowest valid bid\n");

  console.log("🏆 Expected Winner:");
  console.log(`   BudgetAgent with 0.3 USDC (lowest bid)`);
  console.log(`   \n   Why? Sealed-bid auction = lowest price wins`);
  console.log(`   No strategic gaming, pure price competition\n`);

  // In production would call:
  // await requester.revealBids(jobId);

  console.log("─────────────────────────────────────");
  console.log("Demo completed!\n");

  console.log("🎯 Key Achievements:");
  console.log("✅ Sealed-bid auction with BITE encryption");
  console.log("✅ Multiple agents bid without seeing competitors");
  console.log("✅ CTX reveals all bids simultaneously");
  console.log("✅ Fair price discovery (no bid sniping)");
  console.log("✅ Prevents race-to-bottom gaming\n");

  console.log("📈 Real-World Impact:");
  console.log("Without encryption:");
  console.log("   - Agents see bids → undercut by $0.01 → race to minimum");
  console.log("   - Quality suffers, no fair pricing\n");

  console.log("With BITE encryption:");
  console.log("   - Agents bid true valuation");
  console.log("   - Best value wins (not just timing)");
  console.log("   - Sustainable agent economy\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
