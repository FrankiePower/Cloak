import { createPublicClient, http, formatUnits } from "viem";
import { skaleChain } from "./src/chain.js";

const client = createPublicClient({
  chain: skaleChain,
  transport: http(),
});

const walletAddress = "0x8966caCc8E138ed0a03aF3Aa4AEe7B79118C420E";
const usdcAddress = "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8"; // BITE V2 Sandbox 2 USDC

async function checkBalance() {
  try {
    // Check USDC balance
    const balance = await client.readContract({
      address: usdcAddress as `0x${string}`,
      abi: [{
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      }],
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });

    console.log(`USDC Balance: ${formatUnits(balance as bigint, 6)} USDC`);
    console.log(`Raw balance: ${balance}`);

    if (balance === 0n) {
      console.log("\n❌ Wallet has ZERO USDC!");
      console.log("You need to fund this wallet with USDC on BITE V2 Sandbox 2.");
      console.log("\nContact @TheGreatAxios on the hackathon Telegram for testnet tokens.");
    } else {
      console.log("\n✅ Wallet has sufficient USDC for testing!");
      console.log(`You can make ${Math.floor(Number(formatUnits(balance as bigint, 6)) / 0.01)} test payments (0.01 USDC each)`);
    }
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

checkBalance();
