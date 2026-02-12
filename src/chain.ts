import { defineChain } from "viem";

export const skaleChain = defineChain({
    id: 103698795,
    name: "BITE V2 Sandbox 2",
    nativeCurrency: { decimals: 18, name: "sFUEL", symbol: "sFUEL" },
    rpcUrls: {
        default: { http: ["https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"] },
    },
    blockExplorers: {
        default: {
            name: "Blockscout",
            url: "https://base-sepolia-testnet-explorer.skalenodes.com:10032"
        }
    }
});
