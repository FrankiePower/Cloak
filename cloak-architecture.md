
CLOAK
Encrypted Payment Proxy for Autonomous Agents

Architecture Document
SF Agentic Commerce x402 Hackathon  |  February 2026

Built on SKALE  ·  BITE Protocol  ·  x402  ·  Confidential ERC-20

1. Executive Summary
Every x402 payment an AI agent makes is a public signal. On a transparent blockchain, observers can reconstruct an agent’s entire strategy: which APIs it calls, which vendors it pays, how much it spends, and how frequently. For enterprises deploying autonomous agents, this is a competitive intelligence leak.
Cloak is an encrypted payment proxy layer built on SKALE’s BITE (Blockchain Integrated Threshold Encryption) protocol. It lets agents transact via x402 without exposing their payment graph. Transactions are threshold-encrypted before consensus, decrypted only during block execution by the validator supermajority, and the plaintext is never stored on-chain.
Privacy for agents. Transparency for owners.
2. Problem Statement
The x402 protocol enables powerful agent-native, pay-per-use transactions. However, every x402 payment on a transparent chain reveals:
•Vendor relationships — which APIs and services the agent consumes
•Spending patterns — how much and how often, revealing usage intensity
•Strategic intent — payment sequences can be reverse-engineered to infer business logic
•Competitive exposure — rivals can monitor agent activity and front-run or replicate strategies
As agentic commerce scales, this transparency becomes a liability, not a feature. Agents need privacy at the transaction layer.
3. Solution: Cloak
Cloak sits between the AI agent and the blockchain as an encrypted proxy layer. Instead of broadcasting raw x402 payment data, agents route payments through Cloak, which uses SKALE’s BITE protocol to encrypt transaction details before they reach consensus.
3.1 How It Works
1.Agent submits payment intent — The agent calls Cloak’s SDK with the x402 payment details (recipient, amount, API endpoint, calldata).
2.BITE encryption — Cloak uses bite.ts to encrypt the transaction data using the SKALE committee’s BLS threshold public key. The encrypted transaction’s to field is set to the BITE magic address.
3.On-chain opacity — The encrypted blob is submitted to SKALE. Observers see only ciphertext going to the BITE magic address. No payment graph, no amounts, no vendor addresses.
4.Threshold decryption at consensus — During block execution, 2t+1 of 3t+1 validators collectively decrypt the transaction via threshold decryption. The x402 payment executes. Then the ephemeral decryption keys expire.
5.Plaintext vanishes — The decrypted state is never stored on the ledger. Catching-up nodes use BITE Phase 2’s State Diff Set (SDS) mechanism to apply encrypted state diffs without ever seeing plaintext.
6.Owner visibility — The agent owner can retrieve decrypted transaction data via bite.getDecryptedTransactionData() for their own records, audit, and budget management.
3.2 Architecture Diagram
  AI Agent  ───▶  Cloak SDK  ───▶  BITE Encrypt  ───▶  SKALE Chain
  (x402 intent)     (bite.ts)      (BLS threshold)    (encrypted blob)
                                                          │
                                                    Consensus
                                                  (2t+1 decrypt)
                                                          │
  Owner Dashboard  ◀──  getDecryptedTxData()  ◀──  x402 Executes
  (full visibility)    (authorized only)         (plaintext gone)
4. Technical Stack
Component	Technology
Blockchain	SKALE Network (EVM-compatible, gasless)
Encryption	BITE Protocol — BLS threshold encryption via @skalenetwork/bite
Payment Standard	x402 (HTTP 402 Payment Required — Coinbase)
Confidential Tokens	SKALE Confidential ERC-20 (encrypted balances)
Agent Identity	ERC-8004 (on-chain agent identity and trust registry)
Agent Interop	Google A2A / AP2 for cross-agent communication
Agent Wallet	ampersend by Edge & Node (agent wallet + human dashboard)
Smart Contracts	Solidity (Hardhat/Foundry) on SKALE Chain
SDK Language	TypeScript / Node.js
5. Core Components
5.1 Cloak SDK (TypeScript)
A lightweight wrapper around bite.ts that agent developers integrate into their payment workflows. The SDK handles:
•Accepting x402 payment intents (recipient, amount, calldata)
•Encrypting the full transaction payload via BITE before submission
•Handling dual-committee encryption during SKALE committee rotations
•Providing getReceipt() to retrieve decrypted results for the agent owner
5.2 CloakRouter Smart Contract
A Solidity contract deployed on SKALE that acts as the on-chain proxy. Its responsibilities:
•Receives encrypted transaction blobs from agents via BITE
•After threshold decryption, routes the x402 payment to the correct recipient
•Enforces spending limits and access control (only authorized agents can route)
•Emits encrypted event logs for owner audit trail (using Confidential ERC-20 patterns)
•Supports batch payments — multiple x402 calls in a single encrypted transaction
5.3 Confidential Balance Layer
Leveraging SKALE’s Confidential ERC-20 token contracts, Cloak can also encrypt agent balances on-chain. This means even the total funds available to an agent are hidden from observers. The agent’s owner sees the real balance through the decryption API; everyone else sees ciphertext.
5.4 Owner Dashboard
A web interface (React) that lets the agent’s owner:
•View all decrypted payment history in real-time
•Set and modify encrypted spending limits per agent
•See vendor breakdown and spend analytics (decrypted client-side only)
•Revoke agent access or pause payments instantly
6. Security Model
Property	Guarantee	Mechanism
Pre-consensus privacy	Transaction data hidden until block execution	BITE BLS threshold encryption
Ephemeral decryption	Plaintext never stored on ledger	Keys expire after block; SDS for catchup nodes
MEV resistance	No front-running of agent payments	Encrypted until consensus (FAIR chain)
Owner transparency	Agent owner retains full audit access	getDecryptedTransactionData() RPC
Balance privacy	Agent funds hidden from observers	Confidential ERC-20 tokens
7. Hackathon Track Alignment
Cloak is positioned to compete across multiple tracks of the SF Agentic Commerce x402 Hackathon:
Track	Fit	Why
SKALE Bounty	Primary target	Core use of BITE + Confidential ERC-20 + SKALE gasless infra
Overall / Grand Prize	Strong contender	Horizontal infrastructure — every x402 agent benefits from a privacy layer
Coinbase x402	Complementary	Enhances x402 with privacy; doesn’t replace it
8. User Flow
8.1 Agent Developer Integration
The developer experience is intentionally simple. An agent developer replaces their direct x402 payment call with a Cloak-wrapped call:
import { Cloak } from '@cloak/sdk';

const cloak = new Cloak({
  skaleRpc: 'https://mainnet.skalenodes.com/v1/...',
  agentKey: process.env.AGENT_PRIVATE_KEY,
});

// Encrypted x402 payment — on-chain, this is opaque
const receipt = await cloak.pay({
  to: '0xVendorAddress',
  amount: '0.50',  // USDC
  token: 'USDC',
  calldata: '0x...',  // API call payload
});
8.2 What Observers See
Without Cloak	With Cloak
to: 0xVendorAddress	to: 0xBITE_MAGIC_ADDRESS
value: 0.50 USDC	data: 0x8a3f...e7b2 (ciphertext)
data: API endpoint + params visible	Recipient, amount, calldata: all hidden
9. Hackathon Scope (3-Day MVP)
For the hackathon, the deliverable is a focused proof-of-concept demonstrating the core encrypted payment flow:
Must Have
•Cloak SDK wrapping bite.ts for encrypted x402 payment submission
•CloakRouter smart contract on SKALE testnet that receives and routes encrypted payments
•Demo: AI agent paying for an API call with payment details fully encrypted on-chain
•Before/after comparison showing on-chain opacity
Nice to Have
•Confidential ERC-20 balance integration
•Owner dashboard (React) with decrypted payment history
•Batch payment support (multiple x402 calls in one encrypted tx)
•ERC-8004 agent identity integration
•ampersend wallet integration for agent management
10. Competitive Differentiation
Cloak occupies a unique position in the agentic commerce stack:
Approach	Privacy Level	Trade-off
Raw x402 on L1/L2	None — fully transparent	Zero privacy
Mixer/Tornado-style	High — but breaks auditability	Regulatory risk; no owner visibility
ZK-based privacy	High — with proof overhead	Complex; high compute cost; slow
Cloak (BITE)	High — with owner auditability	SKALE-native; gasless; fast; compliant

11. Post-Hackathon Roadmap
•Phase 1 (Hackathon): Core encrypted payment proxy with BITE + x402 on SKALE testnet
•Phase 2: Confidential ERC-20 balances, batch payments, and owner dashboard
•Phase 3: Multi-agent support, cross-chain encrypted settlement via SKALE IMA bridge
•Phase 4: Cloak-as-a-service: managed encrypted proxy for enterprise agent deployments