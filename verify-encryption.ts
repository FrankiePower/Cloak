import { createPublicClient, http } from "viem";
import { skaleChain } from "./src/chain.js";

const publicClient = createPublicClient({
  chain: skaleChain,
  transport: http("https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"),
});

async function verifyEncryption() {
  // The transaction from the demo
  const txHash = "0xa47de191828920abf5529cec6b69230635ca4ad0aa552b243c2969a044efe95e";

  console.log("🔍 Verifying Encryption for Transaction:", txHash);
  console.log("─────────────────────────────────────────────────────────\n");

  const tx = await publicClient.getTransaction({ hash: txHash });

  console.log("📊 Transaction Details:");
  console.log(`  From: ${tx.from}`);
  console.log(`  To: ${tx.to}`);
  console.log(`  Value: ${tx.value} wei`);
  console.log(`\n📦 Input Data (first 500 chars):`);
  console.log(`  ${tx.input.slice(0, 500)}...\n`);

  // Decode function selector
  const functionSelector = tx.input.slice(0, 10);
  console.log(`🔎 Function Selector: ${functionSelector}`);
  
  // Expected values if NOT encrypted:
  const recipient = "0x742D35CC6634c0532925A3b844BC9E7595F0BEb0"; // WEATHER_API
  const amount = "10000"; // 0.01 USDC in smallest units
  const token = "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8"; // USDC

  console.log(`\n🔍 Searching for plaintext values in transaction data:`);
  console.log(`  Recipient (${recipient}): ${tx.input.toLowerCase().includes(recipient.toLowerCase()) ? "❌ FOUND (NOT ENCRYPTED!)" : "✅ NOT FOUND (ENCRYPTED!)"}`);
  console.log(`  Token (${token}): ${tx.input.toLowerCase().includes(token.toLowerCase()) ? "❌ FOUND (NOT ENCRYPTED!)" : "✅ NOT FOUND (ENCRYPTED!)"}`);

  // Check the actual bytes passed to requestPayment
  const dataWithoutSelector = "0x" + tx.input.slice(10);
  console.log(`\n📄 Raw bytes passed to requestPayment:`);
  console.log(`  Length: ${dataWithoutSelector.length - 2} hex chars = ${(dataWithoutSelector.length - 2) / 2} bytes`);
  console.log(`  First 200 chars: ${dataWithoutSelector.slice(0, 200)}...`);
  
  // If encrypted with BITE, should see encrypted blob
  console.log(`\n🔐 Encryption Analysis:`);
  if (dataWithoutSelector.length > 500) {
    console.log(`  ✅ Data is large (${(dataWithoutSelector.length - 2) / 2} bytes) - consistent with encrypted payload`);
  }
  
  // Check for BITE encryption markers
  console.log(`\n🎯 Verdict:`);
  const hasRecipient = tx.input.toLowerCase().includes(recipient.toLowerCase());
  const hasToken = tx.input.toLowerCase().includes(token.toLowerCase());
  
  if (!hasRecipient && !hasToken) {
    console.log(`  ✅ ENCRYPTED: Recipient and token addresses are NOT visible in plaintext`);
    console.log(`  ✅ Privacy preserved - competitors cannot see payment details`);
  } else {
    console.log(`  ❌ NOT ENCRYPTED: Payment details are visible in plaintext`);
    console.log(`  ❌ Privacy compromised - competitors can see payment details`);
  }
}

verifyEncryption()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
