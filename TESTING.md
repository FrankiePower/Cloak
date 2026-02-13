# Testing BITE Sealed-Bid Auction Flow

## Prerequisites

Ensure you have the following set up:
- Bun installed
- Foundry installed
- Agent wallets funded (see setup below)

## 1. Backend Setup (Agent Workers)

### Fund Agent Wallets (One-time setup)
```bash
cd /Users/user/SuperFranky/cloak/skale-city
bun run scripts/fund-agents.ts
```

**Expected Result:**
```
Funding agents with 0.5 sFUEL each...
✅ FastAgent funded: 0.5 sFUEL
✅ QualityAgent funded: 0.5 sFUEL
✅ BudgetAgent funded: 0.5 sFUEL
```

### Start Agent Workers
```bash
cd /Users/user/SuperFranky/cloak/skale-city
bun run agents/agent-worker.ts
```

**Expected Result:**
```
🤖 Agent Worker Started
Agent Type: fast
Address: 0x7a37CaFd4F4C694CB01790340e4698e83Dd36A8f
Marketplace: 0x16232cdB3C00D0bFCDac1F6ecceA51620c759C55
📡 Polling for new jobs every 3 seconds...
```

**What This Does:**
- Monitors the AgentMarketplace contract for new jobs
- Automatically submits encrypted bids when jobs are posted
- Uses agent-specific strategy (fast, quality, or budget multipliers)
- All bids are encrypted using BITE's BLS threshold encryption

## 2. Frontend UI Testing

### Start the Development Server
```bash
cd /Users/user/SuperFranky/cloak/skale-city
bun run dev
# Or from the web app directly:
cd /Users/user/SuperFranky/cloak/skale-city/apps/web
bun run dev
```

**Expected Result:**
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
- Ready in X.Xs
```

### Open the UI
Navigate to: `http://localhost:3000`

### Testing Flow from UI

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Connect your MetaMask/wallet
   - Ensure you're on BITE V2 Sandbox network (Chain ID: 103698795)
   - RPC: `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox`

2. **Post a Job**
   - Fill in job details:
     - Description: "Security Audit"
     - Budget: 10 USDC
     - Deadline: 20 blocks (~4 minutes)
   - Click "Post Job"
   - Approve USDC spending if needed
   - Confirm transaction

3. **Expected Agent Behavior** (in agent-worker terminal)
   ```
   🎯 New job detected: Job #X
   💰 Budget: 10.00 USDC
   📅 Deadline: Block XXXXX
   🔐 Encrypting bid...
   📤 Submitting encrypted bid: 7.00 USDC, 4hr delivery
   ✅ Bid submitted! TX: 0x...
   ```

4. **Wait for Deadline**
   - UI should show countdown timer
   - When deadline hits, click "Reveal Bids"
   - Confirm transaction (requires 0.06 sFUEL for CTX)

5. **Expected Result**
   - BITE validators decrypt all bids in next block
   - Winner automatically selected (lowest bid)
   - Payment sent atomically
   - UI updates to show:
     - Winner address
     - Winning bid amount
     - All revealed bids

## 3. Command-Line Testing (Quick Demo)

### Run Full Demo Script
```bash
cd /Users/user/SuperFranky/cloak/skale-city
bun run scripts/quick-demo.ts
```

**Expected Output:**
```
🚀 Quick Demo - Full BITE Auction Flow

📍 Requester: 0x8966cacc8e138ed0a03af3aa4aee7b79118c420e
🤖 Agents: Fast, Quality, Budget

═══ STEP 1: Approve USDC ═══
✅ Approved 10 USDC

═══ STEP 2: Post Job (20 block deadline) ═══
✅ Job #X posted
   Budget: 10 USDC
   Deadline: Block XXXXX

═══ STEP 3: Submit 3 Bids Immediately ═══
🔐 FastAgent: Encrypting bid (7 USDC, 4hr)...
🔒 FastAgent: Submitting encrypted bid...
   ✅ Bid submitted: 0x...
🔐 QualityAgent: Encrypting bid (8.5 USDC, 24hr)...
🔒 QualityAgent: Submitting encrypted bid...
   ✅ Bid submitted: 0x...
🔐 BudgetAgent: Encrypting bid (4 USDC, 48hr)...
🔒 BudgetAgent: Submitting encrypted bid...
   ✅ Bid submitted: 0x...

📊 Total bids on-chain: 3

═══ STEP 4: Wait for Deadline ═══
⏳ Waiting for bidding to close...
   Block XXXXX | X blocks until deadline (Xs)
⏰ Deadline reached at block XXXXX!

═══ STEP 5: Reveal Bids via BITE CTX ═══
🔓 Calling revealBids() with 0.06 sFUEL for CTX...
   ✅ TX: 0x...
   🔍 Explorer: https://base-sepolia-testnet-explorer.skalenodes.com:10032/...
⏳ BITE validators will decrypt bids in next block (~3-5 seconds)...

═══ STEP 6: Check Winner (onDecrypt executed) ═══
⏳ Waiting for next block for atomic winner selection...
✅ Block XXXXX - onDecrypt() should have executed!

🏆 Checking job status...
Expected winner: BudgetAgent (lowest bid: 4 USDC)
Expected payment: 4 USDC to BudgetAgent
Expected refund: 6 USDC to Requester

✨ Demo complete! Check explorer for winner details.
```

## 4. Verify Results

### Check Job Status (CLI)
```bash
cd /Users/user/SuperFranky/cloak/city-contracts
cast call 0x16232cdB3C00D0bFCDac1F6ecceA51620c759C55 "getJob(uint256)" <JOB_ID> --rpc-url https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
```

### Check Winner Balance
```bash
# Check BudgetAgent USDC balance
cast call 0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8 "balanceOf(address)" 0xFb753bC1070b92a602FC6c185243f2a455AD936E --rpc-url https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox

# Should show 4000000 (4 USDC with 6 decimals)
```

## Network Configuration

### BITE V2 Sandbox
- **Chain ID**: 103698795
- **RPC URL**: `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox`
- **Explorer**: `https://base-sepolia-testnet-explorer.skalenodes.com:10032`
- **Native Token**: sFUEL (free gas)

### Contract Addresses
- **AgentMarketplace**: `0x16232cdB3C00D0bFCDac1F6ecceA51620c759C55`
- **USDC (Test)**: `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8`
- **BITE CTX Precompile**: `0x000000000000000000000000000000000000001B`

### Agent Wallets
- **FastAgent**: `0x7a37CaFd4F4C694CB01790340e4698e83Dd36A8f`
- **QualityAgent**: `0x0644d255991f20F14A75cfECe6C03ef73fFBAD8F`
- **BudgetAgent**: `0xFb753bC1070b92a602FC6c185243f2a455AD936E`

## Troubleshooting

### Agents Not Bidding
- Ensure agent-worker.ts is running
- Check agent wallets are funded (need sFUEL)
- Verify correct marketplace address in agent-worker.ts

### Transaction Failures
- Check gas limits (encrypted bids need ~1,000,000 gas)
- Ensure USDC approval is sufficient
- Verify CTX payment (0.06 sFUEL) is included with revealBids()

### CTX Decryption Fails
- Verify contract uses Solidity ≥0.8.27
- Check `evm_version = "istanbul"` in foundry.toml
- Ensure bids are encrypted using `@skalenetwork/bite` library

### No Winner Selected
- Check that onDecrypt() callback executed in next block
- Verify no security checks rejecting CTX sender
- Look for revert reasons in explorer

## Expected Timeline

1. **Job Posting**: ~5 seconds (1 transaction)
2. **Agent Bidding**: ~15 seconds (3 agents submit bids)
3. **Waiting for Deadline**: 20 blocks × ~3 seconds = ~60 seconds
4. **Reveal & Decrypt**: ~6 seconds (2 blocks)
   - Block N: revealBids() transaction
   - Block N+1: CTX executes, winner selected
5. **Total Time**: ~90 seconds end-to-end

## Security Features Tested

✅ **Bid Privacy**: All bids remain encrypted until simultaneous reveal
✅ **No Bid Sniping**: Agents can't see others' bids before submitting
✅ **Atomic Execution**: Winner selection and payment in single transaction
✅ **Threshold Encryption**: BITE's BLS encryption with network validators
✅ **Trustless**: No centralized party can decrypt early or manipulate results
