import { parseUnits, getAddress } from "viem";
import { createCloak } from "./cloak-sdk.js";
import * as dotenv from "dotenv";

dotenv.config();

// Configuration (using valid checksummed addresses for demo)
// In production, these would be actual API payment addresses
const WEATHER_API = getAddress("0x742d35Cc6634C0532925a3b844Bc9E7595f0bEb0"); // Test recipient 1
const NEWS_API = getAddress("0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"); // Test recipient 2

const config = {
  rpcUrl: "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  routerAddress: process.env.CLOAK_ROUTER_ADDRESS as `0x${string}`,
};

const USDC_ADDRESS = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}`;

async function main() {
  console.log("🔐 Cloak Demo Agent - Encrypted Payments with BITE\n");

  // Initialize Cloak SDK
  const cloak = createCloak(config);
  console.log(`Agent Address: ${cloak.getAddress()}\n`);

  // Step 1: Set Policy
  console.log("Step 1: Setting Encrypted Policy");
  console.log("─────────────────────────────────────");
  
  const policy = {
    dailyLimit: parseUnits("1.0", 6), // 1 USDC per day
    maxPerTx: parseUnits("0.2", 6),   // 0.2 USDC max per transaction
    allowlist: [WEATHER_API, NEWS_API], // Approved vendors
  };

  console.log(`Daily Limit: ${policy.dailyLimit} USDC (encrypted)`);
  console.log(`Max Per Transaction: ${policy.maxPerTx} USDC (encrypted)`);
  console.log(`Allowlist: [WeatherAPI, NewsAPI] (encrypted)`);
  
  try {
    const policyTxHash = await cloak.setPolicy(policy);
    console.log(`✅ Policy set! Tx: ${policyTxHash}\n`);
  } catch (error: any) {
    console.log(`⚠️  Policy already set or error: ${error.message}\n`);
  }

  // Step 2: Make Encrypted Payment
  console.log("Step 2: Making Encrypted Payment to WeatherAPI");
  console.log("─────────────────────────────────────");

  const payment = {
    recipient: WEATHER_API,
    amount: parseUnits("0.01", 6), // 0.01 USDC
    token: USDC_ADDRESS,
  };

  console.log(`Recipient: ${payment.recipient} (will be encrypted)`);
  console.log(`Amount: ${payment.amount} USDC (will be encrypted)`);
  console.log(`Token: ${payment.token} (will be encrypted)`);
  console.log("\n🔒 Encrypting payment with BITE...");

  try {
    const paymentTxHash = await cloak.pay(payment);
    console.log(`✅ Payment submitted! Tx: ${paymentTxHash}`);
    console.log("\n⏳ Waiting for CTX execution (Block N+1)...");
    console.log("    - Block N: Payment encrypted & CTX submitted");
    console.log("    - Consensus: Validators decrypt payment & policy");
    console.log("    - Block N+1: onDecrypt() callback checks conditions");
    console.log("\n🎯 Expected outcome:");
    console.log("    ✅ In allowlist: YES");
    console.log("    ✅ Below max per tx: YES (0.01 < 0.2)");
    console.log("    ✅ Below daily limit: YES (0.01 < 1.0)");
    console.log("    → Payment should EXECUTE");
  } catch (error: any) {
    console.log(`❌ Payment failed: ${error.message}`);
  }

  console.log("\n─────────────────────────────────────");
  console.log("Demo completed!");
  console.log("\n📊 What happened on the blockchain:");
  console.log("   Public sees: Encrypted blob sent to BITE_MAGIC_ADDRESS");
  console.log("   Validators: Decrypted & executed during consensus");
  console.log("   Competitors: Cannot see recipient, amount, or policy");
  console.log("   Owner (you): Can view full history via Cloak SDK");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
