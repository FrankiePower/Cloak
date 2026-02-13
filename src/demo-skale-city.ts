import { parseUnits, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

// Marketplace ABI
const MARKETPLACE_ABI = [
  {
    name: "postJob",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "description", type: "string" },
      { name: "budget", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "paymentToken", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "revealBids",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
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
    name: "getJobBids",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "bidder", type: "address" },
          { name: "encryptedBid", type: "bytes" },
          { name: "timestamp", type: "uint256" },
          { name: "revealed", type: "bool" },
        ],
      },
    ],
  },
] as const;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

// Custom chain config
const biteV2Sandbox = {
  id: 103698795,
  name: "BITE V2 Sandbox",
  nativeCurrency: { name: "sFUEL", symbol: "sFUEL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
    public: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
  },
};

async function main() {
  console.log("🌃 SKALE CITY - Agent Marketplace Demo\n");

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const publicClient = createPublicClient({
    chain: biteV2Sandbox,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: biteV2Sandbox,
    transport: http(),
    account,
  });

  const marketplaceAddress = process.env.AGENT_MARKETPLACE_ADDRESS as `0x${string}`;
  const usdcAddress = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}`;

  console.log("📍 Configuration:");
  console.log(`   Marketplace: ${marketplaceAddress}`);
  console.log(`   USDC Token:  ${usdcAddress}`);
  console.log(`   Requester:   ${account.address}\n`);

  // Step 1: Approve USDC
  console.log("💰 Step 1: Approving USDC for marketplace...");
  const budget = parseUnits("10", 6); // 10 USDC

  const approveHash = await walletClient.writeContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [marketplaceAddress, budget],
    gasPrice: 100000n,
  });

  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log(`   ✅ Approved: ${approveHash}\n`);

  // Step 2: Post Job
  console.log("📋 Step 2: Posting job to marketplace...");
  const currentBlock = await publicClient.getBlockNumber();
  const deadline = currentBlock + BigInt(100); // 100 blocks (~3 minutes)

  const jobDescription = "Analyze Twitter sentiment for $SKALE token over past 24 hours";

  const postJobHash = await walletClient.writeContract({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    functionName: "postJob",
    args: [jobDescription, budget, deadline, usdcAddress],
    gasPrice: 100000n,
  });

  const postJobReceipt = await publicClient.waitForTransactionReceipt({ hash: postJobHash });
  console.log(`   ✅ Job posted: ${postJobHash}`);

  // Extract jobId from logs (assuming it's the first log)
  const jobId = BigInt(1); // For first job, it's ID 1
  console.log(`   📝 Job ID: ${jobId}`);
  console.log(`   📄 Description: "${jobDescription}"`);
  console.log(`   💵 Budget: 10 USDC`);
  console.log(`   ⏰ Deadline: Block ${deadline}\n`);

  console.log("🤖 Step 3: Waiting for agent bids...");
  console.log("   (Start worker agents in separate terminals):");
  console.log("   → npm run agent:fast");
  console.log("   → npm run agent:quality");
  console.log("   → npm run agent:budget\n");

  // Monitor for bids
  console.log("⏳ Monitoring bids (checking every 10 seconds)...\n");

  let lastBidCount = 0;
  const checkInterval = setInterval(async () => {
    try {
      const bids = await publicClient.readContract({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: "getJobBids",
        args: [jobId],
      });

      if (bids.length > lastBidCount) {
        console.log(`📩 New bid received! Total bids: ${bids.length}`);
        lastBidCount = bids.length;
      }

      const currentBlock = await publicClient.getBlockNumber();
      const blocksLeft = Number(deadline - currentBlock);

      if (blocksLeft <= 0) {
        clearInterval(checkInterval);
        console.log("\n⏰ Deadline reached! Revealing bids...\n");
        await revealBids(jobId);
      } else {
        process.stdout.write(`\r   Bids: ${bids.length} | Blocks until deadline: ${blocksLeft}     `);
      }
    } catch (error) {
      console.error("Error monitoring:", error);
    }
  }, 10000);

  async function revealBids(jobId: bigint) {
    console.log("🔓 Step 4: Triggering bid reveal via BITE CTX...");

    const revealHash = await walletClient.writeContract({
      address: marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "revealBids",
      args: [jobId],
      value: parseUnits("0.06", 18), // CTX gas payment
      gasPrice: 100000n,
    });

    await publicClient.waitForTransactionReceipt({ hash: revealHash });
    console.log(`   ✅ Reveal submitted: ${revealHash}\n`);

    console.log("⏳ Waiting for BITE consensus to decrypt bids (next block)...\n");

    // Wait for next block
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check winner
    const job = await publicClient.readContract({
      address: marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: "jobs",
      args: [jobId],
    });

    const [, , , , , , status, winner, winningBid] = job;

    if (status === 2 && winner !== "0x0000000000000000000000000000000000000000") {
      console.log("🏆 WINNER SELECTED!\n");
      console.log(`   Winner:      ${winner}`);
      console.log(`   Winning Bid: ${Number(winningBid) / 1e6} USDC`);
      console.log(`   Status:      Payment released ✅\n`);
    } else {
      console.log("⚠️  No valid bids received or still processing.\n");
    }

    console.log("🎉 Demo complete! View full details:");
    console.log(`   Job:    ${marketplaceAddress}#${jobId}`);
    console.log(`   Chain:  BITE V2 Sandbox (Chain ID: 103698795)\n`);

    process.exit(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
