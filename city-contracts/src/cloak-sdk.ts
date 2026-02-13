import { BITE } from "@skalenetwork/bite";
import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  parseUnits,
  encodePacked,
  encodeAbiParameters,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { skaleChain } from "./chain.js";

export interface CloakConfig {
  rpcUrl: string;
  privateKey: `0x${string}`;
  routerAddress: Address;
}

export interface PolicyLimits {
  dailyLimit: bigint;
  maxPerTx: bigint;
  allowlist: Address[];
}

export interface PaymentRequest {
  recipient: Address;
  amount: bigint;
  token: Address;
}

const CLOAK_ROUTER_ABI = [
  {
    type: "function",
    name: "setPolicy",
    inputs: [{ name: "encryptedLimits", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestPayment",
    inputs: [{ name: "encryptedPayment", type: "bytes" }],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export class Cloak {
  private bite: BITE;
  private wallet: any;
  private publicClient: any;
  private account: any;
  private routerAddress: Address;

  constructor(config: CloakConfig) {
    this.bite = new BITE(config.rpcUrl);
    this.account = privateKeyToAccount(config.privateKey);
    this.routerAddress = config.routerAddress;

    this.wallet = createWalletClient({
      account: this.account,
      chain: { ...skaleChain, fees: undefined },  // Force legacy transactions
      transport: http(config.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: skaleChain,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Set encrypted spending policy
   */
  async setPolicy(limits: PolicyLimits): Promise<Hash> {
    // Encode policy limits: [dailyLimit, maxPerTx, allowlist[]]
    const encodedLimits = encodeAbiParameters(
      [
        { name: "dailyLimit", type: "uint256" },
        { name: "maxPerTx", type: "uint256" },
        { name: "allowlist", type: "address[]" },
      ],
      [limits.dailyLimit, limits.maxPerTx, limits.allowlist]
    );

    // Encrypt using BITE (client-side encryption)
    const encryptedLimits = await this.bite.encryptMessage(encodedLimits);

    // Submit to CloakRouter
    const hash = await this.wallet.writeContract({
      address: this.routerAddress,
      abi: CLOAK_ROUTER_ABI,
      functionName: "setPolicy",
      args: [encryptedLimits as `0x${string}`],
      gasPrice: 100000n,
    });

    return hash;
  }

  /**
   * Make encrypted payment with policy enforcement
   */
  async pay(payment: PaymentRequest): Promise<Hash> {
    // Approve CloakRouter to spend tokens
    await this.approveToken(payment.token, payment.amount);

    // Encode payment: [recipient, amount, token]
    const encodedPayment = encodeAbiParameters(
      [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "token", type: "address" },
      ],
      [payment.recipient, payment.amount, payment.token]
    );

    // Encrypt using BITE (client-side encryption like RPS example)
    const encryptedPayment = await this.bite.encryptMessage(encodedPayment);

    // Submit to CloakRouter with CTX payment
    const hash = await this.wallet.writeContract({
      address: this.routerAddress,
      abi: CLOAK_ROUTER_ABI,
      functionName: "requestPayment",
      args: [encryptedPayment as `0x${string}`],
      value: parseUnits("0.06", 18), // 0.06 sFUEL for CTX
      gasPrice: 100000n,
    });

    return hash;
  }

  async approveToken(token: Address, amount: bigint): Promise<Hash> {
    const hash = await this.wallet.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [this.routerAddress, amount],
      gasPrice: 100000n,  // Force legacy transaction
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  getAddress(): Address {
    return this.account.address;
  }
}

export function createCloak(config: CloakConfig): Cloak {
  return new Cloak(config);
}
