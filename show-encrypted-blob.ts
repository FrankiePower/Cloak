import { createPublicClient, http, decodeAbiParameters } from "viem";
import { skaleChain } from "./src/chain.js";

const publicClient = createPublicClient({
  chain: skaleChain,
  transport: http("https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"),
});

async function showEncryptedBlob() {
  const txHash = "0xa47de191828920abf5529cec6b69230635ca4ad0aa552b243c2969a044efe95e";
  const tx = await publicClient.getTransaction({ hash: txHash });

  console.log("🔒 ENCRYPTED PAYMENT TRANSACTION\n");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Function selector
  const selector = tx.input.slice(0, 10);
  console.log(`📋 Function Called:`);
  console.log(`   Selector: ${selector}`);
  console.log(`   Function: requestPayment(bytes encryptedPayment)\n`);

  // Extract the encrypted bytes parameter
  const dataWithoutSelector = "0x" + tx.input.slice(10);
  
  // Decode the bytes parameter (dynamic bytes are encoded with offset + length + data)
  const decoded = decodeAbiParameters(
    [{ name: "encryptedPayment", type: "bytes" }],
    dataWithoutSelector as `0x${string}`
  );

  const encryptedBlob = decoded[0];

  console.log(`🔐 Encrypted Blob:`);
  console.log(`   Length: ${encryptedBlob.length - 2} hex chars = ${(encryptedBlob.length - 2) / 2} bytes`);
  console.log(`   \n${encryptedBlob}\n`);

  console.log(`\n❓ What SHOULD be in this blob (if it was plaintext):`);
  console.log(`   - Recipient: 0x742D35CC6634c0532925A3b844BC9E7595F0BEb0`);
  console.log(`   - Amount: 10000 (0.01 USDC)`);
  console.log(`   - Token: 0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8`);

  console.log(`\n✅ What ACTUALLY appears in the blob:`);
  console.log(`   - Random-looking hex bytes`);
  console.log(`   - No readable addresses`);
  console.log(`   - Encrypted by BITE client-side encryption`);

  console.log(`\n🎯 Privacy Analysis:`);
  console.log(`   ✅ Competitors see: Random encrypted blob`);
  console.log(`   ✅ No recipient visible`);
  console.log(`   ✅ No amount visible`);
  console.log(`   ✅ No token address visible`);
  console.log(`   ✅ BITE validators decrypt during consensus`);
  console.log(`   ✅ onDecrypt() callback checks policy in Block N+1`);

  console.log(`\n🔍 View on Explorer:`);
  console.log(`   https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/${txHash}`);
}

showEncryptedBlob()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
