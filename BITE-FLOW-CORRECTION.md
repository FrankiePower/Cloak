# BITE Flow Correction - How It Actually Works

## ❌ What I Got Wrong

I described this flow incorrectly:
```
Agent → Cloak → BITE Encrypt → Blockchain → Facilitator → Settlement
```

This makes no sense because:
1. Why would it hit blockchain BEFORE facilitator?
2. That adds unnecessary latency
3. BITE encryption happens ON-CHAIN, not off-chain

## ✅ How BITE Actually Works (From CTX Reference)

### BITE Phase 1: Encrypted Transactions

```
┌─────────────────────────────────────┐
│  Client (Agent)                     │
│  1. Creates transaction payload     │
│  2. Encrypts with bite-ts library   │
│     - Uses network BLS public key   │
│     - Creates encrypted blob        │
└────────────┬────────────────────────┘
             │
             │ Sends encrypted tx
             ▼
┌─────────────────────────────────────┐
│  SKALE Blockchain                   │
│                                     │
│  Block N:                           │
│  - Receives encrypted transaction   │
│  - To field: BITE_MAGIC_ADDRESS     │
│  - Data field: Encrypted blob       │
│                                     │
│  Consensus (between blocks):        │
│  - 2t+1 validators decrypt          │
│  - Using BLS threshold encryption   │
│  - Reveals plaintext tx             │
│                                     │
│  Block N execution:                 │
│  - Execute decrypted transaction    │
│  - Normal EVM execution             │
│  - Plaintext NEVER stored on-chain  │
└────────────┬────────────────────────┘
             │
             │ Transaction executed
             ▼
         [Receipt]
```

**Key Point:** Encryption/decryption happens **during consensus**, not via external service!

### BITE Phase 2: Conditional Transactions (CTX)

```
┌─────────────────────────────────────┐
│  Block N: Smart Contract           │
│                                     │
│  1. Store encrypted data in state   │
│  2. Call submitCTX precompile:      │
│     - encryptedArgs: [balances]     │
│     - plaintextArgs: [addresses]    │
│     - gasLimit: 300000              │
│  3. Returns: CTX_SENDER address     │
│  4. Top up CTX_SENDER wallet        │
└────────────┬────────────────────────┘
             │
             │ CTX queued
             ▼
┌─────────────────────────────────────┐
│  Consensus (between N and N+1)      │
│                                     │
│  - Decrypt all encryptedArgs        │
│  - Create CTX transaction           │
│  - Sign with CTX_SENDER             │
└────────────┬────────────────────────┘
             │
             │ CTX ready
             ▼
┌─────────────────────────────────────┐
│  Block N+1: Execution               │
│                                     │
│  1. CTX placed FIRST (before txs)   │
│  2. CTX calls onDecrypt() callback  │
│  3. Contract uses decrypted data    │
│  4. Updates state                   │
│  5. Block finalized                 │
└─────────────────────────────────────┘
```

**Key Point:** Takes 2 blocks. Data encrypted in Block N, decrypted and executed in Block N+1.

---

## 🔄 Correct Flow for Cloak + x402

### Option 1: BITE Phase 1 (Simpler - Recommended)

```
┌─────────────────────────────────────┐
│  Agent                              │
│  1. Create x402 payment intent      │
│  2. Encrypt with bite-ts:           │
│     - to: WeatherAPI address        │
│     - data: transfer(amount)        │
│     - value: 0                      │
└────────────┬────────────────────────┘
             │
             │ Encrypted transaction
             ▼
┌─────────────────────────────────────┐
│  SKALE Blockchain                   │
│                                     │
│  - Receives encrypted blob          │
│  - To: BITE_MAGIC_ADDRESS           │
│  - Consensus decrypts               │
│  - Executes: transfer() call        │
└────────────┬────────────────────────┘
             │
             │ USDC transferred
             ▼
┌─────────────────────────────────────┐
│  Facilitator (Kobaru) - OPTIONAL    │
│  OR                                 │
│  Direct to API Server               │
│                                     │
│  - Verify payment on-chain          │
│  - Return API response              │
└─────────────────────────────────────┘
```

**Wait... Do We Even Need Kobaru?**

Looking at BITE, the facilitator role changes:
- **Without BITE:** Facilitator verifies signature, settles payment
- **With BITE:** Blockchain handles payment directly

**Two Approaches:**

### Approach A: BITE + Direct Payment (No Facilitator)

```
Agent encrypts:
  - to: USDC_CONTRACT
  - data: transfer(weatherAPI, 0.01)

Blockchain decrypts and executes:
  - USDC transferred directly to weatherAPI

WeatherAPI:
  - Watches blockchain for payment
  - Sees payment confirmed
  - Returns weather data
```

**Pros:**
- ✅ No facilitator needed
- ✅ Direct on-chain payment
- ✅ Simple architecture

**Cons:**
- ❌ API must watch blockchain
- ❌ Not compatible with x402 standard
- ❌ Loses x402 ecosystem

### Approach B: BITE + x402 + Facilitator (Hybrid)

```
Agent encrypts payment details:
  - Payment signature
  - Amount
  - Recipient

Blockchain decrypts:
  - Reveals payment signature

Facilitator verifies:
  - Signature valid
  - Settles payment

API returns data
```

**Pros:**
- ✅ Compatible with x402 ecosystem
- ✅ Works with existing APIs
- ✅ Standard payment flow

**Cons:**
- ❌ More complex
- ❌ Still need facilitator

---

## 🎯 The Real Question: What Should Cloak Encrypt?

### What We ACTUALLY Want to Hide

**Problem:** AI agent strategy exposure
```
Public Blockchain (Without Encryption):
  Tx 1: Agent → WeatherAPI: 0.01 USDC
  Tx 2: Agent → NewsAPI: 0.05 USDC
  Tx 3: Agent → MarketDataAPI: 0.10 USDC
  Tx 4: Agent → DEX: Swap 100 USDC

❌ Competitors see:
   - Which APIs agent uses
   - Payment amounts
   - Payment frequency
   - Can infer trading strategy
```

**Solution: BITE Encryption**
```
Public Blockchain (With BITE):
  Tx 1: Agent → BITE_MAGIC: 0x8f3a9b...  (encrypted)
  Tx 2: Agent → BITE_MAGIC: 0x2b1c4e...  (encrypted)
  Tx 3: Agent → BITE_MAGIC: 0x9d2f1a...  (encrypted)
  Tx 4: Agent → BITE_MAGIC: 0x4c8b2d...  (encrypted)

✅ Competitors see:
   - Only encrypted blobs
   - No recipient info
   - No amount info
   - No pattern recognition
```

### Two Encryption Strategies

**Strategy 1: Encrypt Individual Payments (BITE Phase 1)**
```typescript
// Each payment is encrypted separately
const encryptedTx = await bite.encryptTransaction({
  to: usdcContract,
  data: usdc.encodeFunctionData("transfer", [weatherAPI, 10000]),
  value: 0
});

// Submit to blockchain
const tx = await wallet.sendTransaction({
  to: BITE_MAGIC_ADDRESS,
  data: encryptedTx,
  gasLimit: 300000
});
```

**What's Hidden:**
- ✅ Recipient (weatherAPI address)
- ✅ Amount (10000 = 0.01 USDC)
- ✅ Function call (transfer)

**What's Visible:**
- ❌ Sender (agent wallet)
- ❌ That a BITE transaction occurred
- ❌ Gas used (can infer complexity)

**Strategy 2: Encrypt Batch Payments (BITE Phase 2 CTX)**
```solidity
// Smart contract stores encrypted payment queue
function queuePayment(bytes encryptedPayment) external {
    // Store encrypted payment
    pendingPayments.push(encryptedPayment);

    // Submit CTX to process all pending
    bytes[] memory encryptedArgs = getPendingPayments();
    bytes[] memory plaintextArgs = [msg.sender];

    address ctxSender = submitCTX(
        300000, // gas
        abi.encode(encryptedArgs, plaintextArgs)
    );

    // Top up CTX sender
    payable(ctxSender).transfer(0.01 ether);
}

function onDecrypt(bytes[] decryptedPayments) external {
    // Execute all payments in batch
    for (uint i = 0; i < decryptedPayments.length; i++) {
        (address recipient, uint256 amount) = abi.decode(
            decryptedPayments[i],
            (address, uint256)
        );
        usdc.transfer(recipient, amount);
    }
}
```

**What's Hidden:**
- ✅ All recipient addresses
- ✅ All amounts
- ✅ Number of payments
- ✅ Payment patterns

**What's Visible:**
- ❌ Sender (agent wallet)
- ❌ That CTX was used
- ❌ That onDecrypt was called

---

## 💡 Recommended Approach for Cloak

### Use BITE Phase 1 + Keep x402 Flow

**Why:**
1. **Simpler** - No CTX complexity
2. **Fast** - Single block execution
3. **Compatible** - Works with x402 ecosystem
4. **Sufficient** - Hides recipient and amount

**Architecture:**
```
┌─────────────────────────────────────┐
│  Cloak SDK (Client Side)           │
│                                     │
│  1. Create x402 payment:            │
│     - to: weatherAPI                │
│     - amount: 0.01 USDC             │
│     - signature: sign(payment)      │
│                                     │
│  2. Encrypt payment with BITE:      │
│     const encrypted = await         │
│       bite.encryptTransaction({     │
│         to: usdcContract,           │
│         data: transfer(...)         │
│       })                            │
│                                     │
│  3. Submit encrypted tx to SKALE    │
└────────────┬────────────────────────┘
             │
             │ Encrypted blob
             ▼
┌─────────────────────────────────────┐
│  SKALE Consensus                    │
│  - Decrypt transaction              │
│  - Execute USDC transfer            │
│  - Payment confirmed on-chain       │
└────────────┬────────────────────────┘
             │
             │ Payment visible on-chain
             ▼
┌─────────────────────────────────────┐
│  Facilitator (Kobaru) - Optional    │
│  OR API watches blockchain          │
│                                     │
│  - See payment confirmation         │
│  - Return API data                  │
└─────────────────────────────────────┘
```

**Key Insight:**
- Facilitator sees the DECRYPTED payment (after consensus)
- Public blockchain only sees ENCRYPTED payment
- Competitors can't see payment details

---

## 🔧 Implementation Plan

### Phase 1: Basic BITE Encryption (Start Here)

```bash
npm install @skalenetwork/bite
```

```typescript
// src/bite-wrapper.ts
import { BITE } from "@skalenetwork/bite";
import { skaleChain } from "./chain.js";

export class CloakPayment {
  private bite: BITE;

  constructor(rpcUrl: string) {
    this.bite = new BITE(rpcUrl);
  }

  async encryptedTransfer(
    recipient: string,
    amount: bigint,
    token: string
  ): Promise<string> {
    // Encode transfer call
    const transferData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, amount]
    });

    // Encrypt the transaction
    const encryptedTx = await this.bite.encryptTransaction({
      to: token,
      data: transferData,
      value: 0n
    });

    // Submit to blockchain
    const tx = await wallet.sendTransaction({
      ...encryptedTx,
      gasLimit: 300000 // BITE requirement
    });

    return tx.hash;
  }

  async getDecryptedTx(txHash: string) {
    // Owner can decrypt to see payment details
    return await this.bite.getDecryptedTransactionData(txHash);
  }
}
```

### Phase 2: Add Conditional Logic (If Time Permits)

Use BITE Phase 2 CTX for spending limits:

```solidity
contract CloakRouter {
    mapping(address => uint256) public dailySpent;
    mapping(address => uint256) public dailyLimit;

    function schedulePayment(
        bytes calldata encryptedPayment
    ) external {
        // Store encrypted payment
        // Submit CTX for next block
        // CTX will decrypt and check limits
    }

    function onDecrypt(
        bytes[] calldata decryptedPayments
    ) external {
        // Decrypt reveals: recipient, amount
        // Check if within daily limit
        // Execute or reject
    }
}
```

---

## 📊 Comparison: Before vs After

### Without BITE (Current - Public)
```
Blockchain Explorer:
  From: 0x8966...C420E
  To: 0x2e08...0bD (USDC)
  Function: transfer(0xWeatherAPI, 10000)

❌ Everyone sees:
   - Who paid
   - Who received
   - How much
```

### With BITE Phase 1 (Target - Private)
```
Blockchain Explorer:
  From: 0x8966...C420E
  To: 0x0000...0401 (BITE_MAGIC)
  Data: 0x8f3a9b2e4d1c... (encrypted)

✅ Public sees:
   - Only that agent made a BITE tx
   - Nothing about recipient or amount

✅ Owner can decrypt:
   - Full payment history
   - All details visible
```

---

## 🎯 Bottom Line

**You were right!** The flow shouldn't be:
```
Agent → Blockchain → Facilitator → Blockchain
```

It should be:
```
Agent → Encrypt → Blockchain (decrypt during consensus) → Execute
```

**Facilitator's role (if we keep it):**
- Watches blockchain for decrypted payments
- Verifies x402 payment signatures
- Provides x402 standard compatibility

**But we could also:**
- Skip facilitator entirely
- Have APIs watch blockchain directly
- Use BITE encryption for privacy

**For hackathon, recommend:**
- Use BITE Phase 1 for encryption
- Keep Kobaru for x402 compatibility
- Focus on showing encrypted → decrypt → execute flow

---

**Next: Install BITE SDK and implement encrypted payment wrapper**
