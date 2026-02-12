import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { skaleChain } from "./chain.js";
import "dotenv/config";

type WeatherResponse = {
  success: boolean;
  timestamp: string;
  data: {
    city: string;
    forecast: Array<{
      dayOfWeek: string;
      date: string;
      minTemp: number;
      maxTemp: number;
      condition: "sunny" | "rainy";
    }>;
  };
};

type AccessResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
};

export class WeatherClient {
  private httpClient: x402HTTPClient;
  private walletAddress: string;
  private publicClient: any;
  private baseUrl: string;

  private constructor(
    httpClient: x402HTTPClient,
    walletAddress: string,
    publicClient: any,
    baseUrl: string
  ) {
    this.httpClient = httpClient;
    this.walletAddress = walletAddress;
    this.publicClient = publicClient;
    this.baseUrl = baseUrl;
  }

  static async create(baseUrl: string = "http://localhost:3001"): Promise<WeatherClient> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }

    // Create wallet from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Setup x402 client with EVM scheme
    const evmScheme = new ExactEvmScheme(account);
    const coreClient = new x402Client().register("eip155:*", evmScheme);
    const httpClient = new x402HTTPClient(coreClient);

    const publicClient = createPublicClient({
      chain: skaleChain,
      transport: http(),
    });

    console.log(`[Client] Initialized with wallet: ${account.address}`);

    return new WeatherClient(httpClient, account.address, publicClient, baseUrl);
  }

  async getWeather(): Promise<AccessResult<WeatherResponse>> {
    const url = `${this.baseUrl}/api/weather`;
    console.log("[Client] Requesting weather forecast...");

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Handle 402 Payment Required
      if (response.status === 402) {
        return this.handlePaymentRequired(response, url);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        return { success: false, error: `Request failed: ${response.status} - ${errorBody}`, statusCode: response.status };
      }

      const data = (await response.json()) as WeatherResponse;
      console.log("[Client] Weather data received!");
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Client] Error:", message);
      return { success: false, error: message };
    }
  }

  private async handlePaymentRequired(
    response: Response,
    url: string
  ): Promise<AccessResult<WeatherResponse>> {
    console.log("[Client] Payment required (402), processing...");

    try {
      const responseBody = await response.json();

      // Parse payment requirements from response
      const paymentRequired = this.httpClient.getPaymentRequiredResponse(
        (name: string) => response.headers.get(name),
        responseBody
      );

      console.log("[Client] Payment options:", paymentRequired.accepts.length);

      // Create signed payment payload
      const paymentPayload = await this.httpClient.createPaymentPayload(paymentRequired);
      console.log("[Client] Payment payload created");

      // Encode payment headers
      const paymentHeaders = this.httpClient.encodePaymentSignatureHeader(paymentPayload);

      // Retry request with payment
      console.log("[Client] Retrying with payment...");
      const paidResponse = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...paymentHeaders,
        },
      });

      if (!paidResponse.ok) {
        const errorBody = await paidResponse.text();
        return { success: false, error: `Payment failed: ${paidResponse.status} - ${errorBody}`, statusCode: paidResponse.status };
      }

      // Check settlement response
      const settlement = this.httpClient.getPaymentSettleResponse(
        (name: string) => paidResponse.headers.get(name)
      );

      if (settlement?.transaction) {
        console.log("[Client] Payment settled, tx:", settlement.transaction);
      }

      const data = (await paidResponse.json()) as WeatherResponse;
      console.log("[Client] Weather data received after payment!");
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Client] Payment failed:", message);
      return { success: false, error: message };
    }
  }
}

export default WeatherClient;
