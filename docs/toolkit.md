# Cloak Development Toolkit

**Project:** Encrypted Payment Proxy for Autonomous Agents
**Hackathon:** SF Agentic Commerce x402
**Status:** x402 Payment Flow Working ✅

---

## 🔑 Wallet & Addresses

### Primary Wallet
```
Address: 0x8966caCc8E138ed0a03aF3Aa4AEe7B79118C420E
Balance: 20,000 USDC on BITE V2 Sandbox 2
Purpose: Testing (both payer and receiver)
```

---

## 🌐 Network Configuration

### BITE V2 Sandbox 2 (Current - Hackathon Chain)
```
Chain ID: 103698795 (0x62e516b)
Network Name: BITE V2 Sandbox 2
RPC URL: https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
Explorer: https://base-sepolia-testnet-explorer.skalenodes.com:10032
Currency: sFUEL (gas - free on SKALE)
Features: x402 + BITE Phase 1 & 2 (Encrypted + Conditional TX)
```

**Add to Wallet:** https://base-sepolia.skalenodes.com/chains/bite-v2-sandbox

### SKALE Base Sepolia (Alternative)
```
Chain ID: 324705682
Network Name: SKALE Base Sepolia
RPC URL: https://base-sepolia-testnet.skalenodes.com/v1/base-testnet
Explorer: https://base-sepolia-testnet-explorer.skalenodes.com
Currency: Credits (gas - free)
Features: x402 + BITE Phase 1 only
```

**Add to Wallet:** https://base-sepolia.skalenodes.com/chains/base-testnet

---

## 💰 Token Addresses

### USDC on BITE V2 Sandbox 2 (Current)
```
Address: 0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8
Decimals: 6
Symbol: USDC
Explorer: https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8
```

### Bridged USDC on SKALE Base Sepolia (Alternative)
```
Address: 0x2e08028E3C4c2356572E096d8EF835cD5C6030bD
Decimals: 6
Symbol: USDC
Name: Bridged USDC (SKALE Bridge)
```

### Axios USD on SKALE Base Sepolia (Alternative)
```
Address: 0x61a26022927096f444994dA1e53F0FD9487EAfcf
Decimals: 6
Symbol: Axios USD
```

---

## 🔗 Facilitators

### Kobaru (Current - Recommended)
```
Gateway: https://gateway.kobaru.io
Documentation: https://docs.kobaru.io
Console: https://console.kobaru.io
Supported: BITE V2 Sandbox 2 ✅
Supported: SKALE Base Sepolia ✅
Features: Simple integration, no extra packages needed
```

**Supported Endpoint:**
```bash
curl https://gateway.kobaru.io/supported
```

### x402x (Alternative)
```
Gateway: https://facilitator.x402x.dev
Documentation: https://www.x402x.dev/docs
Features: Advanced features, requires @x402x/extensions
Supported: BITE V2 Sandbox 2 ✅
Supported: SKALE Base Sepolia ✅
```

### PayAI (Alternative)
```
Gateway: https://facilitator.payai.network
Documentation: https://docs.payai.network
Supported: SKALE Base Sepolia ✅
```

---

## 🧪 Test Transaction

### Successful Payment
```
Transaction: 0x2004de3efd3a6a8ee4ad36eae5caea2811814e996c7ee196b367a0f541f5a4e5
Amount: 0.01 USDC
Network: BITE V2 Sandbox 2
Status: Confirmed ✅
Explorer: https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/0x2004de3efd3a6a8ee4ad36eae5caea2811814e996c7ee196b367a0f541f5a4e5
```

---

## 📦 NPM Packages

### Installed
```json
{
  "@hono/node-server": "^1.19.9",
  "@langchain/anthropic": "^1.3.17",
  "@langchain/core": "^1.1.24",
  "@x402/core": "^2.3.1",
  "@x402/evm": "^2.3.1",
  "@x402/hono": "^2.3.0",
  "dotenv": "^17.2.4",
  "hono": "^4.11.9",
  "viem": "^2.45.3"
}
```

### To Install (Next Phase - BITE Encryption)
```bash
npm install @skalenetwork/bite
```

**BITE SDK:**
- Package: [@skalenetwork/bite](https://www.npmjs.com/package/@skalenetwork/bite)
- GitHub: [skalenetwork/bite-ts](https://github.com/skalenetwork/bite-ts)
- Purpose: Threshold encryption for transaction privacy

---

## 🛠 Development Commands

### Check Balance
```bash
npx tsx check-balance.ts
```

### Start Server
```bash
npx tsx src/server.ts
# Server runs on http://localhost:3001
```

### Test Payment Flow
```bash
npx tsx src/index.ts
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Check Weather (Payment Required)
```bash
curl http://localhost:3001/api/weather
```

---

## 🎯 Project Architecture

### Current Stack (Working)
```
┌─────────────────────────────────────┐
│  AI Agent (Weather Client)         │
│  - x402 payment capability          │
│  - Wallet: 0x8966...C420E          │
└────────────┬────────────────────────┘
             │
             │ x402 Payment (0.01 USDC)
             ▼
┌─────────────────────────────────────┐
│  Hono Server (Protected API)        │
│  - x402 middleware                  │
│  - Payment verification             │
│  - Weather forecast service         │
└────────────┬────────────────────────┘
             │
             │ Payment verification
             ▼
┌─────────────────────────────────────┐
│  Kobaru Facilitator                 │
│  - Signature verification           │
│  - On-chain settlement              │
└────────────┬────────────────────────┘
             │
             │ USDC Transfer
             ▼
┌─────────────────────────────────────┐
│  BITE V2 Sandbox 2                  │
│  - USDC Token: 0xc408...4B6D8      │
│  - Transaction confirmation         │
└─────────────────────────────────────┘
```

### Next Phase (To Build)
```
┌─────────────────────────────────────┐
│  BITE Encryption Layer              │
│  - Encrypt payment data             │
│  - Hide recipient, amount, calldata │
│  - Owner-only decryption            │
└────────────┬────────────────────────┘
             │
             │ Encrypted transaction
             ▼
┌─────────────────────────────────────┐
│  CloakRouter Smart Contract         │
│  - Batch payments                   │
│  - Spending limits                  │
│  - Access control                   │
└────────────┬────────────────────────┘
             │
             │ Threshold decryption
             ▼
┌─────────────────────────────────────┐
│  SKALE Consensus (2t+1 nodes)       │
│  - BLS threshold decryption         │
│  - Execute x402 payment             │
│  - Plaintext never stored           │
└─────────────────────────────────────┘
```

---

## 📚 Key Resources

### SKALE Documentation
```
Main Docs: https://docs.skale.space
LLMs Index: https://docs.skale.space/llms.txt
Full Docs: https://docs.skale.space/llms-full.txt
```

### BITE Protocol
```
Introduction: https://docs.skale.space/concepts/bite-protocol/intro-bite-protocol
TypeScript SDK: https://docs.skale.space/developers/bite-protocol/typescript-sdk
Conditional TX: https://docs.skale.space/developers/bite-protocol/conditional-transactions
Phase Overview: https://docs.skale.space/concepts/bite-protocol/phases
```

### x402 Protocol
```
Specification: https://x402.org
Start Guide: https://docs.skale.space/get-started/agentic-builders/start-with-x402
Facilitators: https://docs.skale.space/get-started/agentic-builders/facilitators
Accepting Payments: https://docs.skale.space/cookbook/x402/accepting-payments
Making Payments: https://docs.skale.space/cookbook/x402/buying
```

### Hackathon
```
Telegram: Find on Dora Hacks, tag @TheGreatAxios for tokens
Guide: See hackathon-info.md
```

---

## 🔐 BITE Protocol Constants

### Magic Addresses
```
BITE Phase 1 Magic Address: 0x0000000000000000000000000000000000000401
BITE Phase 2 (CTX) Address: 0x000000000000000000000000000000000000001B
```

### Gas Limits
```
Default BITE Transaction: 300,000 gas
Complex BITE Transaction: 500,000+ gas
Note: Never use estimateGas with BITE (doesn't work)
```

### Committee Model
```
Committee Size: 3t + 1 nodes
Decryption Threshold: 2t + 1 nodes
Rotation Window: 3 minutes before scheduled rotation
```

---

## 🎓 Compiler Settings

### For SKALE Base Sepolia
```
Solidity Version: ≤ 0.8.24 (recommended: 0.8.24)
EVM Version: Shanghai or lower
```

### For BITE V2 Sandbox (CTX)
```
Solidity Version: ≤ 0.8.20
EVM Version: Istanbul
Reason: Conditional Transactions require Istanbul
```

### Foundry Deployment
```bash
forge script script/Deploy.s.sol \
  --rpc-url $SKALE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --slow \
  --broadcast
```

---

## 🗂 Project Files

### Essential Files
```
src/
  ├── agent.ts         - Weather forecast agent (Anthropic Claude)
  ├── chain.ts         - BITE V2 Sandbox 2 chain config
  ├── client.ts        - x402 payment client
  ├── server.ts        - Hono server with payment middleware
  └── index.ts         - Test runner

check-balance.ts       - USDC balance checker utility
.env                   - Environment variables (DO NOT COMMIT)
.env.example           - Template for environment setup
package.json           - Dependencies
tsconfig.json          - TypeScript configuration
```

### Configuration Templates
```bash
# .env structure
ANTHROPIC_API_KEY=      # Claude API key
PRIVATE_KEY=            # Wallet private key (32 bytes hex)
RECEIVING_ADDRESS=      # Payment receiver address
FACILITATOR_URL=        # Kobaru gateway
NETWORK_CHAIN_ID=       # 103698795 (BITE V2)
PAYMENT_TOKEN_ADDRESS=  # USDC token
PAYMENT_TOKEN_NAME=     # USDC
PORT=                   # Server port (default 3001)
```

---

## 🐛 Common Issues & Solutions

### Issue: Port 3001 Already in Use
```bash
# Solution: Kill process on port
lsof -ti:3001 | xargs kill -9
```

### Issue: Payment Verification Fails
```bash
# Check 1: Verify wallet has USDC
npx tsx check-balance.ts

# Check 2: Verify facilitator supports network
curl https://gateway.kobaru.io/supported | jq

# Check 3: Verify .env configuration
cat .env | grep NETWORK_CHAIN_ID
cat .env | grep PAYMENT_TOKEN_ADDRESS
```

### Issue: BITE Transaction Fails
```
Solution: Always set gasLimit manually (300000 default)
Never use estimateGas with BITE transactions
```

### Issue: Committee Rotation
```
Detection: getCommitteesInfo() returns 2 committees
Behavior: Data encrypted with BOTH committee keys
Duration: 3-minute rotation window
```

---

## 📊 Current Status

### Working Components ✅
- [x] x402 payment protocol integration
- [x] Kobaru facilitator connection
- [x] BITE V2 Sandbox 2 configuration
- [x] USDC token setup
- [x] Server with payment middleware
- [x] Client with payment handling
- [x] On-chain settlement
- [x] Transaction confirmation

### To Build 🚧
- [ ] BITE encryption wrapper
- [ ] Encrypted payment flow
- [ ] Owner decryption endpoint
- [ ] CloakRouter smart contract
- [ ] Confidential balance layer
- [ ] Owner dashboard (React)
- [ ] Batch payment support
- [ ] Spending limit controls

### Known Limitations ⚠️
- Anthropic API out of credits (using mock data)
- Self-payment setup (same wallet for payer/receiver)
- Test environment only (BITE V2 Sandbox 2)

---

## 🎯 Next Development Steps

### Phase 1: BITE Encryption (Priority)
```bash
# Install BITE SDK
npm install @skalenetwork/bite

# Create encryption wrapper
touch src/bite-wrapper.ts

# Update client to use encryption
# Update server to handle encrypted requests
# Test encrypted payment flow
```

**Reference:**
- [bite-encrypted-transactions.md](skill/agent-skills/bite-dev-skill/rules/bite-encrypted-transactions.md)
- [privacy-bite-protocol.md](skill/agent-skills/skale-dev-skill/rules/privacy-bite-protocol.md)

### Phase 2: Smart Contracts
```bash
# Initialize Foundry project
forge init contracts

# Create CloakRouter contract
# Deploy to BITE V2 Sandbox
# Test with encrypted payments
```

### Phase 3: Owner Dashboard
```bash
# Initialize React project
npx create-react-app dashboard

# Build decryption interface
# Add spending limit controls
# Implement analytics
```

---

## 📞 Support & Contact

### Hackathon Support
```
Telegram: Tag @TheGreatAxios
Purpose: USDC/sFUEL tokens, technical questions
Response: Usually quick during hackathon
```

### SKALE Resources
```
Discord: https://discord.gg/skale
GitHub: https://github.com/skalenetwork
Twitter: @SkaleNetwork
```

---

## 🏆 Hackathon Tracks

### Primary Target: SKALE Bounty
**Why:** Core use of BITE + x402 + SKALE infrastructure
**Features:**
- BITE threshold encryption ✅ (chain supports)
- x402 payment protocol ✅ (working)
- Zero gas fees ✅ (SKALE native)
- Confidential ERC-20 (to build)

### Secondary: Overall / Grand Prize
**Why:** Horizontal infrastructure - benefits all x402 agents
**Unique Value:** Privacy layer for agentic commerce

---

**Last Updated:** February 12, 2026
**Project Status:** Foundation Complete, Ready for BITE Integration
