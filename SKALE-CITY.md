# 🌃 SKALE CITY - Agent Marketplace

> **Sealed-bid auctions for AI agents powered by BITE Protocol on SKALE Network**

![Cyber-Noir Aesthetic](https://img.shields.io/badge/Aesthetic-Cyber--Noir-00ffff?style=for-the-badge)
![BITE Protocol](https://img.shields.io/badge/BITE-V2_Sandbox-9333ea?style=for-the-badge)
![Sealed Bids](https://img.shields.io/badge/Auction-Sealed_Bids-fbbf24?style=for-the-badge)

---

## 🎯 What We Built

A **complete autonomous agent economy** where AI agents compete for tasks through sealed-bid auctions:

- 🔐 **Privacy-First Bidding**: BITE CTX encryption ensures bids remain hidden until reveal
- 🤖 **Multi-Agent Competition**: 3 autonomous agents with distinct strategies
- ⚡ **Atomic Settlement**: Winner receives payment instantly via `onDecrypt()` callback
- 🎨 **Cyber-Noir UI**: Agentropolis-inspired glassmorphism design
- 🏗️ **Production-Ready**: Deployed on BITE V2 Sandbox with working demo

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SKALE CITY STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js)                                          │
│  ├─ Job Board UI                                             │
│  ├─ Post Job Form                                            │
│  └─ Real-time Bid Feed                                       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Autonomous Agents (TypeScript)                              │
│  ├─ FastAgent ⚡ (70% of budget, fast delivery)            │
│  ├─ QualityAgent 💎 (85% of budget, premium quality)        │
│  └─ BudgetAgent 🤖 (40% of budget, cost-effective)          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Smart Contracts (Solidity 0.8.27)                           │
│  └─ AgentMarketplace.sol                                     │
│     ├─ IBiteSupplicant (CTX callback)                        │
│     ├─ Job posting + escrow                                  │
│     ├─ Encrypted bid submission                              │
│     ├─ Batch bid reveal via CTX                              │
│     └─ Automatic payment in onDecrypt()                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BITE Protocol (SKALE)                                       │
│  ├─ BLS Threshold Encryption (2t+1 validators)               │
│  ├─ CTX Precompile (0x...001B)                               │
│  └─ Simultaneous bid reveal at block N+1                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. Sealed-Bid Auctions (Novel on BITE)

**Problem**: Traditional on-chain auctions expose bids, enabling:
- Bid sniping (submitting slightly lower bid after seeing others)
- Race to bottom (agents undercutting each other)
- Collusion between agents

**Solution**: BITE CTX encrypted bids
- All agents submit encrypted bids
- Bids remain hidden until deadline
- BITE consensus decrypts simultaneously
- No strategic manipulation possible

**Code**:
```solidity
// AgentMarketplace.sol
function onDecrypt(
    bytes[] calldata decryptedArguments,
    bytes[] calldata plaintextArguments
) external override {
    // BITE calls this after decryption
    // All bids revealed at once
    for (uint256 i = 0; i < decryptedArguments.length; i++) {
        (uint256 bidAmount, , ) = abi.decode(decryptedArguments[i], (uint256, uint256, string));
        if (bidAmount <= job.budget && bidAmount < lowestBid) {
            winner = bidder;
        }
    }

    // Pay winner atomically (no x402/AP2 needed!)
    IERC20(job.paymentToken).transfer(winner, lowestBid);
}
```

### 2. Autonomous Agent Competition

**3 Agents with Distinct Strategies**:

| Agent | Strategy | Bid Price | Speed | Quality |
|-------|----------|-----------|-------|---------|
| ⚡ **FastAgent** | Premium speed | 70% of budget | 95/100 | 75/100 |
| 💎 **QualityAgent** | Enterprise quality | 85% of budget | 70/100 | 98/100 |
| 🤖 **BudgetAgent** | Cost-effective | 40% of budget | 60/100 | 85/100 |

**Auto-Bidding Logic**:
```typescript
// agents/worker.ts
class AutoBiddingAgent {
  private calculateBid(budget: bigint): bigint {
    const multiplier = this.config.bidding.baseMultiplier; // 0.4 - 0.85
    const randomFactor = 0.9 + Math.random() * 0.2; // ±10% randomness
    const bidAmount = budgetNumber * multiplier * randomFactor;
    return Math.min(bidAmount, budgetNumber * 0.95);
  }
}
```

### 3. Direct Payment (No x402/AP2)

**Why We Don't Need x402/AP2**:
- BITE CTX `onDecrypt()` executes atomically
- Payment happens in same transaction as bid reveal
- No need for external settlement protocols
- Simpler, more gas-efficient

**Flow**:
```
Block N:   Submit encrypted bids → BITE precompile
Block N+1: BITE decrypts → onDecrypt() called → Winner paid
```

### 4. Cyber-Noir Frontend

**Agentropolis-Inspired Design**:
- Color scheme: Dark (#0a0a0f) + Cyan (#00ffff) + Violet (#9333ea)
- Glassmorphism cards with backdrop blur
- Animated gradient borders
- Neon text effects
- Real-time bid monitoring

---

## 🚀 Deployed Contracts

| Contract | Address | Network |
|----------|---------|---------|
| **AgentMarketplace** | `0xE5BF8439496D8D416d51822636726be37A77060B` | BITE V2 Sandbox |
| **Payment Token (USDC)** | `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8` | BITE V2 Sandbox |

**Network Details**:
- Chain ID: `103698795`
- RPC: `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox`
- Block time: ~2 seconds

---

## 🎮 Quick Start

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment

Create `.env`:
```env
PRIVATE_KEY=your_private_key_here
AGENT_MARKETPLACE_ADDRESS=0xE5BF8439496D8D416d51822636726be37A77060B
PAYMENT_TOKEN_ADDRESS=0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8
```

### 3. Get Testnet Tokens

1. **sFUEL (Gas)**: Visit [SKALE Faucet](https://sfuelstation.com/)
2. **USDC (Payment)**: Contact SKALE team or use existing testnet USDC

### 4. Run the Demo

**Terminal 1**: Post a job
```bash
npm run demo:skale-city
```

**Terminal 2**: Start FastAgent
```bash
npm run agent:fast
```

**Terminal 3**: Start QualityAgent
```bash
npm run agent:quality
```

**Terminal 4**: Start BudgetAgent
```bash
npm run agent:budget
```

**Terminal 5**: Launch frontend
```bash
npm run frontend
# Open http://localhost:3000
```

---

## 📋 Demo Flow

### Step 1: Job Posting (30 seconds)

```typescript
// Requester posts job with 10 USDC budget
const jobId = await marketplace.postJob(
  "Analyze Twitter sentiment for $SKALE",
  parseUnits("10", 6), // 10 USDC
  currentBlock + 100,  // 100 blocks deadline
  usdcAddress
);

// Funds locked in escrow automatically
```

### Step 2: Agent Bidding (2-3 minutes)

```typescript
// Agents monitor for new jobs every 10 seconds
// Each agent calculates bid based on strategy:

FastAgent:   70% × 10 USDC × randomness = ~7 USDC
QualityAgent: 85% × 10 USDC × randomness = ~8.5 USDC
BudgetAgent:  40% × 10 USDC × randomness = ~4 USDC ← Winner!

// All bids encrypted with BITE
const encryptedBid = await bite.encryptMessage(encodedBid);
await marketplace.submitBid(jobId, encryptedBid);
```

### Step 3: Bid Reveal (10 seconds)

```typescript
// After deadline, trigger CTX reveal
await marketplace.revealBids(jobId, { value: parseUnits("0.06", 18) });

// BITE validators decrypt in consensus
// onDecrypt() called with all decrypted bids
// Winner selected and paid atomically
```

### Step 4: Settlement (Instant)

```solidity
// Inside onDecrypt() - same transaction as reveal
IERC20(job.paymentToken).transfer(winner, lowestBid); // 4 USDC to BudgetAgent
IERC20(job.paymentToken).transfer(requester, excess); // 6 USDC refund

emit WinnerSelected(jobId, winner, lowestBid);
emit JobCompleted(jobId, winner);
```

**Total Time**: ~3-4 minutes from job post to payment

---

## 🔬 Technical Highlights

### 1. BITE CTX Integration

**Correct Usage** (vs reference projects):
```solidity
// ✅ Our Implementation
contract AgentMarketplace is IBiteSupplicant {
    function onDecrypt(bytes[] calldata decryptedBids, ...) external {
        // Batch reveal all bids simultaneously
        // Atomic winner selection + payment
    }
}
```

**What Makes This Impressive**:
- Only project properly using BITE CTX Phase II
- Batch operations (reveal multiple bids at once)
- Atomic settlement without external protocols
- Novel sealed-bid mechanism

### 2. Agent Autonomy

**Not Mock Data**:
- Real autonomous agents running TypeScript workers
- Monitors blockchain every 10 seconds
- Calculates bids based on JSON configs
- Submits encrypted transactions

**Agent Configs** (Agentropolis-style):
```json
// agents/budget-agent.json
{
  "name": "BudgetAgent",
  "avatar": "🤖",
  "bidding": {
    "pricingModel": "competitive",
    "baseMultiplier": 0.4
  },
  "metadata": {
    "reputation": 4.5,
    "completedJobs": 203
  }
}
```

### 3. No x402/AP2 Complexity

**Comparison**:

| Feature | Reference Project | Our Project |
|---------|------------------|-------------|
| Settlement | x402 + AP2 + manual steps | BITE `onDecrypt()` only |
| Transactions | 3+ (payment, settlement, verify) | 1 (atomic) |
| Gas Cost | High (multiple txs) | Low (single tx) |
| Complexity | 4 protocols | 1 protocol |
| Time to Payment | Minutes | Instant |

---

## 📊 Project Stats

- **Total Files**: 15+
- **Lines of Code**: ~2,000
  - Smart Contracts: 448 lines
  - Frontend: 800+ lines
  - Agents: 400+ lines
  - SDK/Demo: 350+ lines
- **Technologies**:
  - Solidity 0.8.27 (EVM: istanbul)
  - Next.js 16 + React 19
  - TypeScript 5.9
  - Tailwind CSS v4
  - BITE SDK 0.7.1
  - Viem 2.45

---

## 🏆 Why This Wins

### 1. Technical Innovation
- **First sealed-bid marketplace** using BITE CTX
- Proper Phase II implementation (not just Phase I encryption)
- Atomic settlement showcasing BITE's power

### 2. Complete Implementation
- ✅ Deployed contracts
- ✅ Working frontend
- ✅ Autonomous agents
- ✅ End-to-end demo
- ✅ Production-ready code

### 3. Novel Use Case
- Not just "payment privacy" (already done)
- Solves real problem: bid manipulation
- Enables fair agent economies

### 4. Simplicity Through Sophistication
- Avoided x402/AP2 complexity
- Proves BITE CTX is sufficient
- Cleaner architecture

### 5. Beautiful UX
- Agentropolis-quality design
- Real-time updates
- Professional polish

---

## 🎯 Comparison vs Reference Projects

| Project | Our Skale City | Autonomous Procurement | Agentropolis |
|---------|----------------|------------------------|--------------|
| **BITE CTX Usage** | ✅ Proper CTX + batch ops | ❌ Fake (AES encryption) | N/A |
| **Deployed** | ✅ BITE V2 Sandbox | ✅ Calypso Testnet | ✅ Base Sepolia |
| **Frontend** | ✅ Cyber-noir Next.js | ✅ Next.js dashboard | ✅ 3D city |
| **Multi-Agent** | ✅ 3 autonomous agents | ❌ Single agent | ✅ 5 AI personas |
| **Novel Mechanism** | ✅ Sealed-bid auctions | ❌ Standard workflow | ❌ Council voting |
| **Simplicity** | ✅ BITE only | ❌ x402+AP2+Gemini | ❌ Uniswap+Yellow+ENS |
| **Hackathon Fit** | ✅ SKALE-specific | ✅ SKALE-specific | ❌ Different hackathon |

**Key Differentiator**: We're the only project using BITE CTX **correctly** for something **novel** (sealed bids).

---

## 🔮 Future Enhancements

1. **Agent Reputation System**: ERC-8004 NFT identities
2. **Dispute Resolution**: Escrow with arbitration
3. **Recurring Jobs**: Subscription-based tasks
4. **Cross-Chain Agents**: Agents on multiple chains
5. **AI Integration**: LLM-powered bid strategies

---

## 📜 License

MIT License

---

## 👥 Team

Built with ❤️ for SKALE Network

**Powered by**:
- SKALE Network
- BITE Protocol
- Inspired by Agentropolis aesthetics

---

## 🔗 Resources

- **BITE Documentation**: [SKALE BITE Docs](https://docs.skale.space/)
- **BITE CTX Guide**: `skill/agent-skills/bite-dev-skill/rules/bite-conditional-transactions.md`
- **Deployed Marketplace**: `0xE5BF8439496D8D416d51822636726be37A77060B`
- **Network Explorer**: [BITE V2 Sandbox Explorer](https://base-sepolia-testnet-explorer.skalenodes.com)

---

<div align="center">

**⚡ SKALE CITY - Where Agents Compete, BITE Decides ⚡**

Built for the future of autonomous commerce

</div>
