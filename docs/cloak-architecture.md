# CLOAK
**Encrypted Payment Proxy for Autonomous Agents**

---

**Architecture Document**
SF Agentic Commerce x402 Hackathon | February 2026

Built on **SKALE** · **BITE Protocol** · **Threshold Encryption**

---

## 1. Executive Summary

Every payment an AI agent makes is a public signal. On transparent blockchains, observers can reconstruct an agent's entire strategy: which APIs it calls, which vendors it pays, how much it spends, and when. For enterprises deploying autonomous agents, this is a competitive intelligence leak.

**Cloak** is an encrypted payment layer built on SKALE's BITE (Blockchain Integrated Threshold Encryption) protocol. It enables agents to make payments without exposing their payment graph to competitors. Transaction details are threshold-encrypted client-side, decrypted during consensus by validator supermajority (2t+1 of 3t+1), and the plaintext is never stored on-chain.

**Privacy from competitors. Transparency for owners.**

---

## 2. Problem Statement

Autonomous agents need to buy data and services to operate. However, every blockchain payment reveals:

- **Vendor relationships** — which APIs and services the agent consumes
- **Spending patterns** — how much and how often, revealing usage intensity
- **Strategic intent** — payment sequences can be reverse-engineered to infer business logic
- **Competitive exposure** — rivals can monitor agent activity and front-run or replicate strategies

**Example:** An AI trading agent pays for:
1. NewsAPI: 0.05 USDC (public)
2. PriceOracle: 0.10 USDC (public)
3. DEX Swap: 100 USDC (public)

Competitors see the exact sequence and can front-run the trade. The agent's strategy is exposed.

As agentic commerce scales, this transparency becomes a **liability, not a feature**. Agents need privacy at the transaction layer.

---

## 3. Solution: Cloak

Cloak provides **two-layer protection** for agent payments:

### Layer 1: Payment Privacy (BITE Phase 1)
Encrypts payment details so competitors can't see recipient, amount, or calldata.

### Layer 2: Policy Enforcement (BITE Phase 2 - CTX)
Enforces encrypted spending limits, allowlists, and approval workflows.

Together, these layers enable **commercial deployment** of AI agents that:
- ✅ Keep strategy private from competitors
- ✅ Operate autonomously within owner-defined limits
- ✅ Provide full audit trail for compliance

---

## 4. How It Works

### 4.1 BITE Phase 1: Payment Privacy

**Flow:**
```
1. Agent creates payment intent
   └─> Cloak SDK encrypts locally using BITE
       └─> to: API address
       └─> amount: 0.01 USDC
       └─> calldata: transfer()

2. Submit encrypted blob to SKALE
   └─> To: BITE_MAGIC_ADDRESS (0x0000...0401)
   └─> Data: 0x8f3a9b2e4d1c... (encrypted)

3. SKALE Consensus (between blocks)
   └─> 2t+1 validators threshold-decrypt
   └─> BLS threshold encryption
   └─> Plaintext never stored

4. Block Execution
   └─> Execute: USDC.transfer(API, 0.01)
   └─> Payment confirmed on-chain

5. API receives payment
   └─> Watches blockchain events
   └─> Returns data to agent
```

**What Competitors See:**
```
Blockchain Explorer:
  From: 0x8966...C420E (Agent)
  To: 0x0000...0401 (BITE_MAGIC)
  Data: 0x8f3a9b2e... (ENCRYPTED BLOB)

❌ No recipient visible
❌ No amount visible
❌ No API endpoint visible
```

**What Owner Sees:**
```typescript
const decrypted = await bite.getDecryptedTransactionData(txHash);
// {
//   to: "0xWeatherAPI",
//   amount: "10000",  // 0.01 USDC
//   calldata: "0x..."
// }

✅ Full visibility via decryption key
```

---

### 4.2 BITE Phase 2: Policy Enforcement (CTX)

**Conditional Transactions (CTX)** enable smart contracts to decrypt data and make decisions.

**Flow:**
```
Block N: Agent Requests Payment
  └─> Contract stores encrypted:
      - Payment: [recipient, amount]
      - Policy: [dailyLimit, allowlist, maxPerTx]
  └─> Calls submitCTX precompile
  └─> Pays 0.06 sFUEL for CTX gas

Block N+1: Consensus Decrypts & Executes
  └─> Validators decrypt both encrypted blobs
  └─> Contract's onDecrypt() callback invoked
  └─> Check conditions:
      - Is recipient in allowlist? ✅
      - Is amount < maxPerTx? ✅
      - Is dailySpent + amount < dailyLimit? ✅
  └─> If all pass: Execute payment
  └─> If any fail: Reject & emit event
```

**Why This Matters:**
- Owner sets encrypted policy once
- Competitors can't see spending limits
- Agent operates autonomously within guardrails
- Owner retains control without constant oversight

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Component | Technology |
|-----------|------------|
| **Blockchain** | SKALE Network (EVM-compatible, gasless for users) |
| **Encryption** | BITE Protocol — BLS threshold encryption |
| **Chain** | BITE V2 Sandbox 2 (Chain ID: 103698795) |
| **RPC** | https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox |
| **Payment Token** | USDC (0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8) |
| **Client Library** | @skalenetwork/bite (TypeScript) |
| **Smart Contract Library** | @skalenetwork/bite-solidity (Foundry) |
| **SDK Language** | TypeScript / Node.js |

### 5.2 BITE Protocol Details

#### Phase 1: Encrypted Transactions
- **Magic Address:** `0x0000000000000000000000000000000000000401`
- **Gas Limit:** 300,000 (must set manually, estimateGas doesn't work)
- **Encryption:** Client-side with network's BLS threshold public key
- **Decryption:** During consensus by 2t+1 of 3t+1 validators
- **Performance:** Single block execution

#### Phase 2: Conditional Transactions (CTX)
- **Precompile Address:** `0x000000000000000000000000000000000000001B`
- **Gas Limit:** 2,500,000 per CTX
- **Payment:** 0.06 sFUEL per CTX submission
- **Execution:** Two-block model (submit in N, execute in N+1)
- **Interface:** `IBiteSupplicant.onDecrypt(bytes calldata)`
- **Compiler:** Solidity ≥0.8.27, EVM version = istanbul

---

## 6. Core Components

### 6.1 Cloak SDK (TypeScript)

A lightweight SDK that wraps BITE and simplifies agent payment workflows.

**Key Features:**
- One-line encrypted payments
- Automatic policy enforcement
- Owner decryption for audit
- Committee rotation handling

**Example Usage:**
```typescript
import { Cloak } from '@cloak/sdk';

const cloak = new Cloak({
  rpcUrl: 'https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox',
  privateKey: process.env.AGENT_KEY
});

// Owner sets policy (encrypted on-chain)
await cloak.setPolicy({
  dailyLimit: parseUnits("1.0", 6),      // 1 USDC per day
  maxPerTx: parseUnits("0.2", 6),        // 0.2 USDC max
  allowlist: [WEATHER_API, NEWS_API]     // Approved vendors only
});

// Agent makes encrypted payment
await cloak.pay({
  to: WEATHER_API,
  amount: parseUnits("0.01", 6),
  token: USDC_ADDRESS
});
// ✅ Encrypted on public chain
// ✅ Policy checked via CTX
// ✅ Competitors see nothing useful

// Owner views history
const history = await cloak.getHistory(ownerKey);
// Returns decrypted payment log for owner only
```

---

### 6.2 CloakRouter Smart Contract

Deployed on SKALE BITE V2 Sandbox 2, acts as the on-chain policy enforcement layer.

**Responsibilities:**
- Store encrypted policies per agent
- Track daily spending limits
- Submit CTX for policy verification
- Execute or reject payments based on conditions
- Emit events for owner monitoring

**Core Functions:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { IBiteSupplicant } from "@skalenetwork/bite-solidity/interfaces/IBiteSupplicant.sol";
import { BITE } from "@skalenetwork/bite-solidity/BITE.sol";

contract CloakRouter is IBiteSupplicant {
    struct Policy {
        bytes encryptedLimits;  // [dailyLimit, maxPerTx, allowlist[]]
        uint256 dailySpent;
        uint256 lastResetDay;
    }

    mapping(address => Policy) public policies;

    event PaymentExecuted(address indexed agent, address recipient, uint256 amount);
    event PaymentRejected(address indexed agent, address recipient, uint256 amount, string reason);

    /// @notice Owner sets encrypted policy for their agent
    function setPolicy(bytes calldata encryptedLimits) external {
        policies[msg.sender] = Policy({
            encryptedLimits: encryptedLimits,
            dailySpent: 0,
            lastResetDay: block.timestamp / 1 days
        });
    }

    /// @notice Agent requests payment (triggers CTX)
    function requestPayment(
        bytes calldata encryptedPayment  // [recipient, amount, token]
    ) external payable {
        require(msg.value >= 0.06 ether, "CTX payment required");

        Policy storage policy = policies[msg.sender];
        require(policy.encryptedLimits.length > 0, "No policy set");

        // Reset daily counter if new day
        uint256 today = block.timestamp / 1 days;
        if (today > policy.lastResetDay) {
            policy.dailySpent = 0;
            policy.lastResetDay = today;
        }

        // Submit CTX with encrypted payment + policy
        bytes memory ctxData = abi.encode(
            msg.sender,
            policy.dailySpent,
            encryptedPayment,
            policy.encryptedLimits
        );

        (bool success, ) = BITE.SUBMIT_CTX_ADDRESS.call{ value: msg.value }(
            abi.encodeWithSelector(
                BITE.submitCTX.selector,
                address(this),
                ctxData
            )
        );
        require(success, "CTX submission failed");
    }

    /// @notice BITE callback after decryption (Block N+1)
    function onDecrypt(bytes calldata decryptedData) external override {
        require(msg.sender == BITE.SUBMIT_CTX_ADDRESS, "Only BITE");

        (
            address agent,
            uint256 dailySpent,
            bytes memory paymentData,
            bytes memory policyData
        ) = abi.decode(decryptedData, (address, uint256, bytes, bytes));

        // Decrypt payment details
        (address recipient, uint256 amount, address token) =
            abi.decode(paymentData, (address, uint256, address));

        // Decrypt policy
        (uint256 dailyLimit, uint256 maxPerTx, address[] memory allowlist) =
            abi.decode(policyData, (uint256, uint256, address[]));

        // Check policy conditions
        bool inAllowlist = false;
        for (uint i = 0; i < allowlist.length; i++) {
            if (allowlist[i] == recipient) {
                inAllowlist = true;
                break;
            }
        }

        bool withinLimits = (
            amount <= maxPerTx &&
            dailySpent + amount <= dailyLimit
        );

        // Execute or reject
        if (inAllowlist && withinLimits) {
            IERC20(token).transferFrom(agent, recipient, amount);
            policies[agent].dailySpent += amount;
            emit PaymentExecuted(agent, recipient, amount);
        } else {
            string memory reason = !inAllowlist ? "Not in allowlist" : "Exceeds limit";
            emit PaymentRejected(agent, recipient, amount, reason);
        }
    }
}
```

---

### 6.3 Encryption Flow Diagram

```
┌─────────────────────────────────────┐
│  Agent (Client Side)                │
│                                     │
│  1. Create payment intent           │
│  2. Cloak SDK encrypts with BITE    │
│     - Uses network BLS public key   │
│     - AES + threshold encryption    │
└────────────┬────────────────────────┘
             │
             │ Encrypted blob
             ▼
┌─────────────────────────────────────┐
│  SKALE Blockchain (Public)          │
│                                     │
│  Mempool:                           │
│  - To: BITE_MAGIC_ADDRESS           │
│  - Data: 0x8f3a9b... (ENCRYPTED)    │
│                                     │
│  ❌ Competitors see only ciphertext │
└────────────┬────────────────────────┘
             │
             │ Block finalization
             ▼
┌─────────────────────────────────────┐
│  SKALE Consensus (Private)          │
│                                     │
│  Validators (2t+1 of 3t+1):         │
│  - Threshold decrypt with BLS       │
│  - Reveal: to, amount, calldata     │
│  - Execute: USDC.transfer()         │
│                                     │
│  ⚠️ Plaintext NEVER stored on-chain │
└────────────┬────────────────────────┘
             │
             │ Payment confirmed
             ▼
┌─────────────────────────────────────┐
│  Service Provider / API             │
│                                     │
│  - Watches blockchain events        │
│  - Sees payment confirmation        │
│  - Returns data to agent            │
└────────────┬────────────────────────┘
             │
             │ Data delivered
             ▼
┌─────────────────────────────────────┐
│  Owner Dashboard                    │
│                                     │
│  - Calls getDecryptedTxData()       │
│  - Views full payment history       │
│  - Analyzes spending patterns       │
│                                     │
│  ✅ Only owner can decrypt          │
└─────────────────────────────────────┘
```

---

## 7. Security Model

| Property | Guarantee | Mechanism |
|----------|-----------|-----------|
| **Pre-consensus privacy** | Transaction data hidden until block execution | BITE BLS threshold encryption |
| **Ephemeral decryption** | Plaintext never stored on ledger | Keys expire after block execution |
| **MEV resistance** | No front-running of agent payments | Encrypted until consensus |
| **Owner transparency** | Agent owner retains full audit access | `getDecryptedTransactionData()` RPC |
| **Policy enforcement** | Agent cannot exceed limits | BITE Phase 2 CTX with onDecrypt validation |
| **Competitor opacity** | Rivals see only encrypted blobs | Public blockchain shows ciphertext only |

---

## 8. Hackathon Track Alignment

### Track: "Encrypted Agents"
**Judges:** Sawyer Cutler (SKALE), Manuel Barbas (SKALE)
**Prize:** $2,000 + $2,500 SKALE Credits (1st place)

#### Requirements vs. Cloak:

| Requirement | Cloak Implementation |
|-------------|---------------------|
| **Uses BITE v2 materially** | ✅ Both Phase 1 (encryption) & Phase 2 (CTX) |
| **Demonstrates conditional trigger** | ✅ Spending limits, allowlists checked via CTX |
| **Shows encrypted → condition → decrypt → execute** | ✅ Full lifecycle in demo |
| **Receipt/trace** | ✅ Owner can decrypt via RPC, blockchain explorer shows execution |

#### Win Conditions vs. Cloak:

| Criterion | Cloak Approach |
|-----------|----------------|
| **Clear why condition & encryption matter** | Prevents competitive intelligence leaks, enables commercial deployment |
| **Clean auditable lifecycle** | Policy definition → encrypted intent → CTX check → execution → owner audit |
| **Strong UX and trust model** | Owner: full visibility. Agent: autonomy within limits. Competitors: zero visibility. |
| **Commerce-grade with guardrails** | Daily limits, allowlists, max per transaction, owner approval for large amounts |

---

## 9. Use Case: AI Trading Fund

**Scenario:** Hedge fund deploys AI agent to trade crypto based on data analysis.

### Without Cloak (Current Reality):

```
Public Blockchain:
  Tx 1: Agent → NewsAPI: 0.05 USDC
  Tx 2: Agent → PriceOracle: 0.10 USDC
  Tx 3: Agent → SentimentAPI: 0.03 USDC
  Tx 4: Agent → DEX: Swap 100 USDC for WETH

Competitor Hedge Fund sees:
  "They buy news, then price data, then sentiment.
   10 minutes later they swap USDC for WETH.

   This is their trading signal!
   Let's front-run their trades."

❌ Strategy exposed
❌ Cannot operate profitably
❌ Business model broken
```

### With Cloak:

```
Public Blockchain:
  Tx 1: Agent → BITE_MAGIC: 0x8f3a9b... (encrypted)
  Tx 2: Agent → BITE_MAGIC: 0x2b1c4e... (encrypted)
  Tx 3: Agent → BITE_MAGIC: 0x9d2f1a... (encrypted)
  Tx 4: Agent → BITE_MAGIC: 0x4c8b2d... (encrypted)

Competitor Hedge Fund sees:
  "Agent is doing... something?
   But what? To whom? How much? When?

   Cannot infer strategy.
   Cannot front-run."

✅ Strategy protected
✅ Can operate profitably
✅ Commercial deployment viable

Owner Dashboard shows:
  - NewsAPI: 0.05 USDC (decrypted)
  - PriceOracle: 0.10 USDC (decrypted)
  - SentimentAPI: 0.03 USDC (decrypted)
  - DEX Swap: 100 USDC (decrypted)

  Total spent today: 0.18 USDC (within 1.0 USDC limit) ✅
```

---

## 10. Competitive Differentiation

| Approach | Privacy Level | Owner Audit | Speed | Complexity | Compliance |
|----------|---------------|-------------|-------|------------|------------|
| **Raw blockchain** | None | Full | Fast | Simple | Compliant |
| **Mixer/Tornado** | High | ❌ None | Slow | Medium | ⚠️ Risky |
| **ZK-SNARKs** | High | Possible | Slow | Very High | Compliant |
| **Cloak (BITE)** | High | ✅ Full | Fast (1 block) | Low | ✅ Compliant |

**Cloak's Unique Position:**
- ✅ Privacy from competitors (like mixers/ZK)
- ✅ Full owner visibility (unlike mixers)
- ✅ Fast execution (1 block Phase 1, 2 blocks Phase 2)
- ✅ Simple integration (one SDK call)
- ✅ Zero gas fees (SKALE native)
- ✅ Regulatory compliant (owner can prove legitimacy)

---

## 11. Hackathon Deliverables

### Must Build (3-Day Scope):

1. **Cloak SDK (TypeScript)**
   - Wrap BITE Phase 1 for encrypted payments
   - Wrap BITE Phase 2 for policy enforcement
   - Simple API: `cloak.pay()`, `cloak.setPolicy()`, `cloak.getHistory()`

2. **CloakRouter Contract (Solidity)**
   - Policy storage (encrypted)
   - CTX submission logic
   - `onDecrypt()` callback with condition checks
   - Deploy to BITE V2 Sandbox 2

3. **Demo Agent (TypeScript)**
   - AI agent that buys weather data
   - Makes multiple payments
   - Shows encrypted transactions on blockchain
   - Shows policy enforcement (rejection when limit exceeded)

4. **Demo Video (3 minutes)**
   - Show: Agent makes payment (encrypted)
   - Show: Public blockchain (only encrypted blob visible)
   - Show: Policy check (spending limit enforced)
   - Show: Competitor view (nothing useful)
   - Show: Owner view (full decrypted history)

### Nice to Have:

- Owner dashboard UI (React)
- Batch payment support
- Multi-agent management
- Spending analytics

---

## 12. Development Setup

### Prerequisites:
```bash
# Node.js dependencies
npm install @skalenetwork/bite viem ethers

# Foundry for smart contracts
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install BITE Solidity library
forge install skalenetwork/bite-solidity
```

### Environment Configuration:
```bash
# .env
PRIVATE_KEY=0x...
RPC_URL=https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
CHAIN_ID=103698795
USDC_ADDRESS=0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8
```

### Foundry Configuration:
```toml
# foundry.toml
[profile.default]
solc_version = "0.8.27"
evm_version = "istanbul"  # Required for CTX

[rpc_endpoints]
bite_sandbox = "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox"
```

### Deploy Contract:
```bash
forge script script/Deploy.s.sol \
  --rpc-url bite_sandbox \
  --private-key $PRIVATE_KEY \
  --legacy \
  --slow \
  --broadcast
```

---

## 13. References & Resources

### SKALE Documentation:
- Main Docs: https://docs.skale.space
- BITE Protocol: https://docs.skale.space/concepts/bite-protocol/intro-bite-protocol
- BITE TypeScript SDK: https://docs.skale.space/developers/bite-protocol/typescript-sdk
- Conditional Transactions: https://docs.skale.space/developers/bite-protocol/conditional-transactions

### Libraries:
- **bite-ts**: https://github.com/skalenetwork/bite-ts
- **bite-solidity**: https://github.com/skalenetwork/bite-solidity
- **npm**: @skalenetwork/bite

### Reference Implementations:
- **CTX Examples**: `/reference/ctxs/` (this repo)
- **BITE Dev Skills**: `/skill/agent-skills/bite-dev-skill/`
- **SKALE Dev Skills**: `/skill/agent-skills/skale-dev-skill/`

### Hackathon Resources:
- Hackathon Page: https://docs.skale.space/get-started/hackathon/info
- Get Test Tokens: Tag @TheGreatAxios in hackathon Telegram

---

## 14. Project Timeline

### Day 1: Core Infrastructure
- ✅ Setup development environment
- ✅ Deploy CloakRouter contract
- ✅ Build basic Cloak SDK
- ✅ Test BITE Phase 1 encryption

### Day 2: Policy Layer & Demo
- 🔄 Implement CTX policy enforcement
- 🔄 Build demo agent (weather data buyer)
- 🔄 Test complete flow end-to-end
- 🔄 Verify on blockchain explorer

### Day 3: Demo & Documentation
- 📹 Record demo video
- 📝 Write README and docs
- 🎨 Polish UX (optional dashboard)
- 🚀 Submit to hackathon

---

## 15. Success Metrics

### Technical:
- ✅ Payments encrypted on public chain
- ✅ Policy checks executed via CTX
- ✅ Owner can decrypt transaction history
- ✅ Competitors cannot see payment details
- ✅ Sub-2-block execution time

### Business:
- ✅ Clear value proposition (privacy enables commercial deployment)
- ✅ Real use case (AI trading agents)
- ✅ Production-ready guardrails (limits, allowlists)
- ✅ Strong trust model (owner visibility, competitor opacity)

### Hackathon:
- ✅ Satisfies all "Encrypted Agents" track requirements
- ✅ Demonstrates BITE v2 materially (both phases)
- ✅ Shows conditional triggers (policy enforcement)
- ✅ Clear encrypted → decrypt → execute lifecycle
- ✅ Commerce-grade with realistic use case

---

## Conclusion

**Cloak enables commercial deployment of AI agents by solving the competitive intelligence problem.**

Without Cloak: Agent payments are public → Strategy exposed → Cannot operate profitably

With Cloak: Payments are encrypted → Competitors see nothing → Can operate commercially

**Built on proven technology (SKALE BITE), solving a real problem (agent privacy), with a clear path to adoption (simple SDK).**

---

**Repository:** https://github.com/FrankiePower/Cloak
**Demo Video:** [To be recorded]
**Live Demo:** [To be deployed]

**Contact:** Available in hackathon Telegram
