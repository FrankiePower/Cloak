# Encrypted Agents Track - Cloak Alignment

## 🏆 Track Requirements vs Current Status

### Track: "Encrypted Agents"
**Judges:** Sawyer Cutler (VP Dev Success, SKALE), Manuel Barbas (Deployment Engineer, SKALE)
**Prize:** 1st: $2,000 + $2,500 credits | 2nd: $1,000 + $2,500 credits

---

## ✅ Must-Have Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Uses BITE v2 materially** | ⏳ TO BUILD | Need to add BITE encryption wrapper |
| **Demonstrates conditional trigger** | ⏳ TO BUILD | Need to add spending limits / allowlists |
| **Shows encrypted → condition → execute** | ⏳ TO BUILD | Need full lifecycle demo |
| **Receipt/trace** | ✅ WORKING | Transaction explorer shows settlement |

---

## 🎯 Win Conditions

### 1. Clear Why Condition + Encryption Matter

**Our Story:**
```
Problem:
  AI agent buys market data APIs
  → Every payment is PUBLIC on blockchain
  → Competitors see which APIs, how often, how much
  → Can front-run agent's trading strategy
  → Business intelligence leak

Solution (Cloak):
  → BITE encrypts payment details
  → Competitors see only ciphertext
  → Conditional logic prevents overspending
  → Owner retains full visibility
  → Strategy remains private
```

**Impact:**
- ✅ Prevents competitive intelligence leaks
- ✅ Enables commercial agent deployment
- ✅ Maintains owner oversight
- ✅ Real business value

### 2. Clean Auditable Lifecycle

**Current Flow (Working):**
```
Agent → x402 Payment → Kobaru → Settlement
✅ Works but everything is PUBLIC
```

**Target Flow (To Build):**
```
1. Agent Intent
   "Pay 0.01 USDC to WeatherAPI"

2. Policy Definition (Encrypted Conditions)
   - Daily limit: 1 USDC
   - Allowlist: [WeatherAPI, MarketDataAPI]
   - Require owner approval if > 0.1 USDC

3. BITE Encryption
   Cloak SDK encrypts:
   - recipient: 0xWeatherAPI
   - amount: 10000 (0.01 USDC)
   - calldata: API parameters

4. On-chain Storage
   Encrypted blob stored on BITE V2 Sandbox
   Competitors see: 0x8f3a9b2e... (ciphertext)

5. Condition Check (BITE v2 CTX)
   IF amount < daily_limit
      AND recipient IN allowlist
      AND (amount < 0.1 OR owner_approved)
   THEN proceed
   ELSE reject

6. Threshold Decryption
   2t+1 validators decrypt via BLS threshold encryption

7. x402 Execution
   Payment processes via Kobaru facilitator

8. Receipt
   Owner can call: getDecryptedTxData(txHash)
   Competitors cannot decrypt (no keys)
```

### 3. Strong UX and Trust Model

**Key Questions:**

| Question | Cloak Answer |
|----------|--------------|
| **What is private?** | Recipient address, amount, API endpoint, calldata |
| **When does it unlock?** | When conditions are met (spending limit, allowlist, time) |
| **Who can trigger?** | Agent (within limits) or Owner (approval required) |
| **What happens if it fails?** | Transaction reverts, encrypted blob discarded, no payment |
| **Who can see history?** | Owner only (via decryption keys) |
| **What do competitors see?** | Only encrypted blobs (no useful information) |

**Trust Model:**
```
┌─────────────────────────────────────┐
│  Agent (Limited Autonomy)           │
│  - Can pay within limits            │
│  - Cannot see other agents          │
│  - Monitored by owner               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Owner (Full Visibility)            │
│  - Can decrypt all history          │
│  - Can set/modify limits            │
│  - Can revoke agent access          │
│  - Can see real-time analytics      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Competitors (No Visibility)        │
│  - See only encrypted blobs         │
│  - Cannot determine strategy        │
│  - Cannot front-run decisions       │
└─────────────────────────────────────┘
```

### 4. Commerce-Grade Use Case

**Scenario: AI Trading Agent**

**Setup:**
- Agent monitors crypto prices via APIs
- Buys market data, news feeds, oracle updates
- Makes trading decisions based on aggregated data
- Executes trades on DEX

**Without Cloak (Current Reality):**
```
Problem 1: Strategy Exposure
  Agent pays NewsAPI: 0.05 USDC → PUBLIC
  Agent pays PriceOracle: 0.02 USDC → PUBLIC
  Agent swaps 100 USDC WETH → PUBLIC

  ❌ Competitors see:
     - Which data sources used
     - Payment frequency (urgency signal)
     - Trading patterns
     - Can front-run trades

Problem 2: No Spending Controls
  Agent compromised? Could drain wallet
  No limits, no oversight until too late

Problem 3: No Audit Trail
  Owner can't see payment history easily
  No analytics on API usage
  No cost breakdown
```

**With Cloak (Our Solution):**
```
✅ Privacy:
   All payments encrypted
   Competitors see only ciphertext
   Strategy remains confidential

✅ Control:
   Daily limit: 10 USDC
   Allowlist: Approved APIs only
   Approval required for large payments

✅ Visibility:
   Owner dashboard shows all payments (decrypted)
   Real-time analytics
   Cost breakdown by vendor
   Spending alerts

✅ Security:
   Agent can't drain wallet (limits enforced)
   Encrypted spending caps
   Multi-sig for high-value transactions
```

**Guardrails (Commerce-Grade):**
- ✅ Spending limits (daily, per-transaction)
- ✅ Allowlist enforcement (approved vendors only)
- ✅ Approval workflows (owner signature for large amounts)
- ✅ Time-based restrictions (trading hours only)
- ✅ Emergency pause (owner can freeze agent)

---

## 🎬 Demo Flow (For Video)

### Act 1: The Problem (30 seconds)
```
Show: Regular x402 payment (no Cloak)
  1. Agent pays WeatherAPI
  2. Show blockchain explorer
  3. Highlight: Amount visible, recipient visible
  4. Voiceover: "Competitors can see everything"
```

### Act 2: Cloak Setup (30 seconds)
```
Show: Setting up Cloak
  1. Install Cloak SDK
  2. Configure conditions:
     - Daily limit: 1 USDC
     - Allowlist: [WeatherAPI, NewsAPI]
  3. Voiceover: "With Cloak, we encrypt payment details"
```

### Act 3: Encrypted Payment (60 seconds)
```
Show: Payment with Cloak
  1. Agent calls: cloak.pay({to, amount, data})
  2. Show terminal: "Encrypting with BITE..."
  3. Show blockchain explorer:
     - Data field: 0x8f3a9b2e... (encrypted)
     - To field: BITE magic address
  4. Show: Competitor view (only ciphertext)
  5. Show: Condition check passes
  6. Show: Payment executes
  7. Voiceover: "Competitors see nothing useful"
```

### Act 4: Owner View (30 seconds)
```
Show: Owner dashboard
  1. Click "Decrypt History"
  2. Show table:
     - Date | Recipient | Amount | API Call
     - All decrypted, clean view
  3. Show analytics:
     - Total spent: 0.05 USDC
     - Most used: WeatherAPI
     - Within limits: ✅
  4. Voiceover: "Owner has full visibility and control"
```

### Act 5: Condition Enforcement (30 seconds)
```
Show: Spending limit hit
  1. Agent tries to pay 2 USDC (over daily limit)
  2. Show: Condition check fails
  3. Show: Transaction reverted
  4. Show: Owner notification
  5. Voiceover: "Guardrails prevent overspending"
```

**Total: 3 minutes, clear story, strong demo**

---

## 🔧 What We Need to Build

### Critical Path (Must Build for Submission)

**1. BITE Encryption Wrapper (2 hours)**
```typescript
// src/bite-wrapper.ts
import { BITE } from "@skalenetwork/bite";

export class CloakPayment {
  private bite: BITE;

  async encryptedPay(payment: PaymentIntent): Promise<string> {
    // 1. Encrypt payment data with BITE
    const encryptedTx = await this.bite.encryptTransaction({
      to: payment.recipient,
      data: payment.calldata,
      value: payment.amount
    });

    // 2. Submit encrypted transaction
    const tx = await wallet.sendTransaction({
      ...encryptedTx,
      gasLimit: 300000
    });

    return tx.hash;
  }

  async getDecryptedHistory(txHash: string) {
    // Owner can decrypt transaction data
    return await this.bite.getDecryptedTransactionData(txHash);
  }
}
```

**2. Conditional Logic (2 hours)**
```typescript
// src/conditions.ts
export interface PaymentConditions {
  dailyLimit: bigint;
  allowlist: string[];
  requireApproval: bigint; // Amount threshold
}

export function checkConditions(
  payment: PaymentIntent,
  conditions: PaymentConditions,
  dailySpent: bigint
): boolean {
  // Check daily limit
  if (dailySpent + payment.amount > conditions.dailyLimit) {
    return false;
  }

  // Check allowlist
  if (!conditions.allowlist.includes(payment.recipient)) {
    return false;
  }

  // Check approval requirement
  if (payment.amount > conditions.requireApproval) {
    // Require owner signature (to implement)
    return false;
  }

  return true;
}
```

**3. Update Client (1 hour)**
```typescript
// src/client.ts
import { CloakPayment } from "./bite-wrapper.js";

const cloak = new CloakPayment(skaleRpcUrl);

// Instead of direct payment:
const txHash = await cloak.encryptedPay({
  recipient: weatherApiAddress,
  amount: 10000n, // 0.01 USDC
  calldata: weatherCalldata
});
```

**4. Demo Script (2 hours)**
```typescript
// demo/demo-script.ts
// Full demo showing:
// - Regular payment (public)
// - Cloak payment (encrypted)
// - Condition enforcement
// - Owner decryption
```

**5. Demo Video (2 hours)**
- Record screen
- Add voiceover
- Show blockchain explorer
- Show encryption/decryption
- Upload to YouTube

**Total: ~9 hours of focused work**

---

## 📊 Scoring Rubric (Our Prediction)

### Technical Implementation (40 points)
| Criteria | Our Score | Evidence |
|----------|-----------|----------|
| BITE v2 integration quality | 35/40 | Proper encryption, threshold decryption, conditional logic |
| Code quality | 8/10 | Clean TypeScript, well-structured |
| Working demo | 10/10 | Full end-to-end working |

### Use Case & Impact (30 points)
| Criteria | Our Score | Evidence |
|----------|-----------|----------|
| Clear why privacy matters | 28/30 | Competitive intelligence protection, real business value |
| Realistic commerce use | 10/10 | AI trading agents are real and valuable |

### UX & Trust Model (20 points)
| Criteria | Our Score | Evidence |
|----------|-----------|----------|
| Clear privacy model | 18/20 | Owner visibility, competitor opacity, clear conditions |
| Auditable lifecycle | 10/10 | Full trace from intent to settlement |

### Presentation (10 points)
| Criteria | Our Score | Evidence |
|----------|-----------|----------|
| Demo video quality | 9/10 | Clear story, good production |
| Documentation | 5/5 | Comprehensive toolkit, architecture docs |

**Predicted Total: 93/100** → Strong contender for 1st place

---

## 🎯 Differentiation from Competition

**What Makes Cloak Different:**

1. **Horizontal Infrastructure** (not single-use)
   - Works for ANY x402 agent
   - Not locked to specific API or use case
   - Reusable privacy layer

2. **Real Business Value** (not just tech demo)
   - Solves actual problem: competitive intelligence
   - Commercial agents need this
   - Clear path to production

3. **Complete Trust Model** (not just encryption)
   - Owner has full visibility
   - Agent has controlled autonomy
   - Competitors have zero visibility

4. **Production-Ready Guardrails** (not just PoC)
   - Spending limits
   - Allowlists
   - Approval workflows
   - Emergency controls

**Why This Wins:**
- ✅ Judges are from SKALE (care about BITE usage quality)
- ✅ Clear problem + solution fit
- ✅ Real-world applicable
- ✅ Good technical execution
- ✅ Strong presentation

---

## 🚀 Next Steps

**Immediate (Start Now):**
1. Install BITE SDK: `npm install @skalenetwork/bite`
2. Create bite-wrapper.ts with encryption logic
3. Test encrypted payment flow
4. Add conditional logic

**By End of Day:**
1. Working encrypted payment demo
2. Condition enforcement working
3. Owner decryption working

**Tomorrow:**
1. Record demo video
2. Polish documentation
3. Submit project

**Time Required:**
- Core implementation: 5 hours
- Demo + video: 4 hours
- **Total: 9 hours** (doable in 1 day)

---

**Remember:** Kobaru is infrastructure (commodity). Cloak is innovation (differentiator). Focus on BITE encryption layer, not facilitator choice. That's what wins.
