payai
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.skale.space/llms.txt
> Use this file to discover all available pages before exploring further.

# PayAI

> Integrate PayAI facilitator for x402 payment processing

PayAI is a hosted facilitator service that simplifies x402 payment processing. Instead of running your own facilitator infrastructure, you can use PayAI's endpoints to handle payment verification and settlement.

## Prerequisites

* Node.js and npm installed
* A SKALE Chain endpoint
* Basic understanding of x402 protocol

## Configuration

### Environment Variables

Create a `.env` file with PayAI configuration:

```bash  theme={null}
# Facilitator Router Address
RECEIVING_ADDRESS=0xFacilitatorReceivingAddress

# Payment token configuration
PAYMENT_TOKEN_ADDRESS=0x2e08028E3C4c2356572E096d8EF835cD5C6030bD
PAYMENT_TOKEN_NAME="Bridged USDC (SKALE Bridge)"

# SKALE network configuration
NETWORK_CHAIN_ID=324705682
```

## Integration with PayAI

<Tabs>
  <Tab title="Server Setup">
    ```typescript  theme={null}
    import { Hono } from "hono";
    import { serve } from "@hono/node-server";
    import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
    import { ExactEvmScheme } from "@x402/evm/exact/server";
    import { HTTPFacilitatorClient } from "@x402/core/server";
    import type { Network } from "@x402/core/types";
    import "dotenv/config";

    const app = new Hono();

    async function main() {
      // Point to PayAI facilitator
      const facilitatorUrl = "https://facilitator.payai.network";
      const receivingAddress = process.env.RECEIVING_ADDRESS as `0x${string}`;
      const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}`;
      const paymentTokenName = process.env.PAYMENT_TOKEN_NAME ;
      const networkChainId = process.env.NETWORK_CHAIN_ID;
      const network: Network = `eip155:${networkChainId}`;

      // Initialize PayAI facilitator client
      const facilitatorClient = new HTTPFacilitatorClient({ 
        url: facilitatorUrl 
      });
      
      const resourceServer = new x402ResourceServer(facilitatorClient);
      resourceServer.register("eip155:*", new ExactEvmScheme());

      // Apply payment middleware
      app.use(
        paymentMiddleware(
          {
            "GET /api/data": {
              accepts: [
                {
                  scheme: "exact",
                  network: network,
                  payTo: receivingAddress,
                  price: {
                    amount: "10000", // 0.01 tokens
                    asset: paymentTokenAddress,
                    extra: {
                      name: paymentTokenName,
                      version: "1",
                    },
                  },
                },
              ],
              description: "Premium data access",
              mimeType: "application/json",
            },
          },
          resourceServer
        )
      );

      // Protected endpoint
      app.get("/api/data", (c) => {
        return c.json({
          message: "Premium data unlocked via PayAI!",
          timestamp: new Date().toISOString(),
        });
      });

      const port = 3000;
      serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Using PayAI facilitator: ${facilitatorUrl}`);
      });
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Client Setup">
    ```typescript  theme={null}
    import { x402Client, x402HTTPClient } from "@x402/core/client";
    import { ExactEvmScheme } from "@x402/evm";
    import { privateKeyToAccount } from "viem/accounts";
    import "dotenv/config";

    async function main() {
      // Setup wallet
      const account = privateKeyToAccount(
        process.env.PRIVATE_KEY as `0x${string}`
      );

      // Create x402 client
      const evmScheme = new ExactEvmScheme(account);
      const coreClient = new x402Client().register("eip155:*", evmScheme);
      const httpClient = new x402HTTPClient(coreClient);

      // Access PayAI-protected resource
      const url = "http://localhost:3000/api/data";
      const response = await fetch(url);

      if (response.status === 402) {
        console.log("Payment required, processing via PayAI...");

        const responseBody = await response.json();
        const paymentRequired = httpClient.getPaymentRequiredResponse(
          (name: string) => response.headers.get(name),
          responseBody
        );

        const paymentPayload = await httpClient.createPaymentPayload(
          paymentRequired
        );
        
        const paymentHeaders = httpClient.encodePaymentSignatureHeader(
          paymentPayload
        );

        const paidResponse = await fetch(url, {
          headers: { ...paymentHeaders },
        });

        const data = await paidResponse.json();
        console.log("Data received:", data);
      }
    }

    main();
    ```
  </Tab>
</Tabs>

## Troubleshooting

### Connection Issues

If you cannot connect to PayAI:

1. Verify the facilitator URL is correct
2. Check network connectivity
3. Ensure API credentials are valid
4. Review firewall settings

### Payment Failures

Common causes and solutions:

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough tokens          |
| Network mismatch      | Check chain ID matches configuration    |
| Expired authorization | Increase `maxTimeoutSeconds`            |

## Next Steps

<CardGroup cols={2}>
  <Card title="SKALE Supported Facilitators" icon="dollar-sign" href="/get-started/agentic-builders/facilitators">
    Alternative facilitator with advanced features
  </Card>

  <Card title="Run Your Own" icon="server" href="/cookbook/x402/facilitator">
    Deploy your own facilitator infrastructure
  </Card>

  <Card title="Accept Payments" icon="dollar-sign" href="/cookbook/x402/accepting-payments">
    Protect endpoints with payment middleware
  </Card>

  <Card title="Make Payments" icon="credit-card" href="/cookbook/x402/buying">
    Build clients that handle x402 payments
  </Card>
</CardGroup>

## Resources

* [PayAI Documentation](https://docs.payai.network/x402/supported-networks)
* [x402 Protocol Specification](https://x402.org)

***

<Note>
  This entity -- PayAI -- is deployed and activley supporting SKALE. These are 3rd party services that may have their own terms and conditions and privacy polices. Use these services at your own risk. AI and agents is a highly experimental space; the 3rd party software solutions may have bugs or be unaudited. You and your agents and your customers use all 3rd party services chosen at your own risk and per their terms.
</Note>


x402x
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.skale.space/llms.txt
> Use this file to discover all available pages before exploring further.

# x402x

> Integrate x402x facilitator for advanced payment processing features

x402x is an advanced facilitator service that extends the base x402 protocol with additional features for enterprise use cases. It provides enhanced payment processing, analytics, and customization options.

## Prerequisites

* Node.js and npm installed
* A SKALE Chain endpoint
* Understanding of x402 protocol

## Configuration

### Environment Variables

Create a `.env` file with x402x configuration:

```bash  theme={null}
# Your receiving address
RECEIVING_ADDRESS=0xyour_address_to_receive_payment

# SKALE network configuration
NETWORK_CHAIN_ID=324705682
```

## Basic Integration

<Tabs>
  <Tab title="Server Setup">
    ```typescript  theme={null}
    import { Hono } from "hono";
    import { serve } from "@hono/node-server";
    import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
    import { ExactEvmScheme } from "@x402/evm/exact/server";
    import { registerExactEvmScheme } from "@x402/evm/exact/server";
    import type { RouteConfig as X402RouteConfig } from "@x402/core/server";
    import { HTTPFacilitatorClient } from "@x402/core/server";
    import {
      registerRouterSettlement,
      registerSettlementHooks,
      createSettlementRouteConfig,
    } from "@x402x/extensions";
    import "dotenv/config";

    const app = new Hono();
    const PORT = 3000;

    async function main() {

    app.use(
      "/*",
      cors({
        origin: "*",
        credentials: false,
        exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
        allowHeaders: [
          "Content-Type",
          "PAYMENT-SIGNATURE",
          "PAYMENT-RESPONSE",
          "X-PAYMENT-SIGNATURE",
          "X-PAYMENT-RESPONSE",
        ],
      }),
    );

      const facilitatorUrl = "https://facilitator.x402x.dev";
      const receivingAddress = process.env.RECEIVING_ADDRESS as `0x${string}`;
      const networkChainId = process.env.NETWORK_CHAIN_ID || "324705682";
      const network = `eip155:${networkChainId}`;

      // Initialize x402x facilitator client with authentication
      const facilitatorClient = new HTTPFacilitatorClient({
        url: facilitatorUrl
        });

      const resourceServer = new x402ResourceServer(facilitatorClient);
      registerExactEvmScheme(resourceServer, {
        networks: ["eip155:*"],
      });
      registerRouterSettlement(resourceServer);
      registerSettlementHooks(resourceServer);
      await resourceServer.initialize();

      const routes = {
        "GET /api/premium": createSettlementRouteConfig(
          {
            accepts: {
              scheme: "exact",
              network,
              payTo: receivingAddress,
              price: "$0.01",
            },
          },
          {
            // Dynamic fee: query facilitator /calculate-fee on 402 probe
            facilitatorUrl,
          },
      
        ) as X402RouteConfig,
      };
      app.use("/api/premium", paymentMiddleware(routes, resourceServer));

      app.get("/api/premium", async (c) => {
        console.log("[Server] Weather request received");
        return c.json({
          message: "Premium content unlocked via x402x!",
          features: ["analytics", "webhooks", "rate-limiting"],
          timestamp: new Date().toISOString(),
        });
      });

      serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Using x402x facilitator: ${facilitatorUrl}`);
      });
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Client Setup">
    ```typescript  theme={null}
      import { wrapFetchWithPayment } from "x402-fetch";
      import { x402Client } from "@x402/core/client";
      import { registerX402xScheme } from "@x402x/extensions";
      import { privateKeyToAccount } from "viem/accounts";

      import "dotenv/config";

      async function main() {
          const account = privateKeyToAccount(
            process.env.PRIVATE_KEY as `0x${string}`
          );
          const baseUrl = process.env.BASE_URL || "http://localhost:3001";
          const networkChainId = process.env.NETWORK_CHAIN_ID || "324705682";

          const client = new x402Client();
          const networkId = `eip155:${networkChainId}` as `${string}:${string}`;
          registerX402xScheme(client, "eip155:324705682", account);

          const fetchWithPayment = wrapFetchWithPayment(fetch, client);
          
          const fetchWithPayment = wrapFetchWithPayment(
              fetch,
              client
            );

          const premium_url = `${baseUrl}/api/premium`;

          try{
          const response = await fetchWithPayment(premium_url, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              });
          const data = await response.json();
          console.log(data);
          }
          catch(error){
            console.error(
              "[Client] Error:",
              error instanceof Error ? error.message : error
            );
            process.exit(1);
          }

          const response = await fetchWithPayment("/api/premium-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ /* your data */ }),
          });
          const result = await response.json();
        }

    main();
    ```
  </Tab>
</Tabs>

## Troubleshooting

### Connection Issues

If you cannot connect to x402x:

1. Verify the facilitator URL is correct
2. Check network connectivity
3. Ensure API credentials are valid
4. Review firewall settings

### Payment Failures

Common causes and solutions:

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| Invalid signature     | Verify wallet configuration and signing |
| Insufficient balance  | Ensure payer has enough tokens          |
| Network mismatch      | Check chain ID matches configuration    |
| Expired authorization | Increase `maxTimeoutSeconds`            |

## Next Steps

<CardGroup cols={2}>
  <Card title="SKALE Supported Facilitators" icon="dollar-sign" href="/get-started/agentic-builders/facilitators">
    Alternative facilitator with advanced features
  </Card>

  <Card title="Run Your Own" icon="server" href="/cookbook/x402/facilitator">
    Deploy your own facilitator
  </Card>

  <Card title="Accept Payments" icon="credit-card" href="/cookbook/x402/accepting-payments">
    Protect endpoints with payments
  </Card>

  <Card title="Build an Agent" icon="robot" href="/cookbook/agents/build-an-agent">
    Create payment-enabled agents
  </Card>
</CardGroup>

## Resources

* [x402x Documentation](https://www.x402x.dev/docs)
* [x402 Protocol Specification](https://x402.org)

***

<Note>
  This entity -- x402x -- is deployed and activley supporting SKALE. These are 3rd party services that may have their own terms and conditions and privacy polices. Use these services at your own risk. AI and agents is a highly experimental space; the 3rd party software solutions may have bugs or be unaudited. You and your agents and your customers use all 3rd party services chosen at your own risk and per their terms.
</Note>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.skale.space/llms.txt
> Use this file to discover all available pages before exploring further.

# Kobaru

> Payment infrastructure for devs with reliability, control and speed

[Kobaru](https://www.kobaru.io) enables machine-to-machine payments, allowing AI agents and automated systems to pay per request. With payment infrastructure built for developers they aim to deliver reliable, transparent payments without operational overhead.

## Why SKALE Base with Kobaru?

<Note>
  Kobaru makes it easy to get started with x402 payments on SKALE. Just hook right up to the gateway with your existing SDK -- setting Kobaru as the facilitator -- and you can start accepting payments on SKALE.
</Note>

**x402 Facilitator** Point your SDK to `https://gateway.kobaru.io` and start accepting payments with SKALE.

**Instant settlement.** SKALE's instant finality—faster than any other network. Your customers get immediate access, you get immediate revenue.

**Predictable costs.** No gas price spikes or unexpected fees. Perfect for high-volume APIs processing thousands of micropayments daily.

***

## Prerequisites

* A EVM wallet address - to receive USDC payments
* An API you want to monetize
* Basic understanding of x402 protocol. To learn more about it check [here](/get-started/agentic-builders/start-with-x402).

***

## Instant API Monetization

**Transparent Proxy**, a Kobaru product, transforms any existing API into a monetized endpoint without modifying your backend. No code changes. No deployment cycles. No infrastructure modifications.

This is not just "zero code"—this is production-ready monetization that works with your existing infrastructure exactly as it runs today.

### Step 1: Create Your Kobaru Account

1. Go to [console.kobaru.io](https://console.kobaru.io)
2. Sign up with your email

### Step 2: Register Your API

In the Kobaru Console:

1. Click **New Service**
2. Configure your service:
   * **Service name**: Descriptive name (e.g., `skale-data-api`)
   * **Backend URL**: Your API's base URL (e.g., `https://api.yourcompany.com`)
   * **Slug**: Unique identifier for proxy URL (e.g., `skale-data`)
3. Define your first paid route:
   * **Route pattern**: Endpoint path (e.g., `/premium-data`)
   * **Price**: Cost per request in USD (e.g., `$0.001`)
   * **Network**: Select **SKALE Base** (Mainnet or Sepolia)
   * **Usage model**: `pay_per_request` or `pay_per_time`

### Step 3: Go Live and Get Paid

Your API is now accessible at:

```
https://access.kobaru.io/{your-slug}/premium-data
```

**That's it.** Your API is now x402-compatible an able to be paid for by both humans and agents using x402. Kobaru automatically:

* Returns an HTTP 402 response with payment requirements on unpaid requests
* Verifies payments on SKALE Base with cryptographic proof
* Forwards authenticated requests to your backend
* Settles payments to your wallet in \~1 second
* Logs every transaction for reconciliation

***

## x402 SDK integration

Environment variables:

```bash  theme={null}
# Required: Your wallet to receive payments
WALLET_ADDRESS=0xYourWalletAddress

# Optional: Kobaru API key for enhanced features
KOBARU_API_KEY=your_api_key_from_console
```

Here's a minimal example to accept SKALE payments with Kobaru:

<Tabs>
  <Tab title="Server Setup">
    ```typescript  theme={null}
    import { Hono } from "hono";
    import { serve } from "@hono/node-server";
    import { cors } from "hono/cors";
    import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
    import { ExactEvmScheme } from "@x402/evm/exact/server";
    import { HTTPFacilitatorClient } from "@x402/core/server";
    import "dotenv/config";

    const app = new Hono();
    app.use("*", cors());

    async function main() {
      // Configure Kobaru facilitator
      const facilitatorUrl = "https://gateway.kobaru.io";
      const facilitatorClient = new HTTPFacilitatorClient({
        url: facilitatorUrl
            })
      

      // Register EVM payment scheme for SKALE
      const resourceServer = new x402ResourceServer(facilitatorClient);
      resourceServer.register("eip155:*", new ExactEvmScheme());

      // Fetch token metadata from Kobaru instead of hardcoding
      const networkId = "eip155:324705682"; // SKALE Base Mainnet
      const assetAddress = "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD"; // USDC on SKALE Base

      // Define payment requirements
      const routes = {
        "GET /api/data": {
          accepts: [
            {
              scheme: "exact",
              network: networkId,
              payTo: process.env.WALLET_ADDRESS as `0x${string}`,
              price: {
                amount: "1000", // 0.001 USDC
                asset: assetAddress,
                extra: { 
                  name: "USDC", 
                  version: "2" 
                  }
              }
            }
          ],
          description: "Premium data access",
          mimeType: "application/json"
        }
      };

      // Apply payment middleware
      app.use("*", paymentMiddleware(routes, resourceServer));

      // Protected endpoint
      app.get("/api/data", (c) => {
        return c.json({
          message: "Premium data unlocked!",
          timestamp: new Date().toISOString()
        });
      });

      const port = 3000;
      serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Using Kobaru facilitator: ${facilitatorUrl}`);
      });
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Client Setup">
    ```typescript  theme={null}
    import { x402Client, x402HTTPClient } from "@x402/core/client";
    import { ExactEvmScheme } from "@x402/evm";
    import { privateKeyToAccount } from "viem/accounts";
    import "dotenv/config";

    async function main() {
      const account = privateKeyToAccount(
        process.env.PRIVATE_KEY as `0x${string}`
      );

      const evmScheme = new ExactEvmScheme(account);
      const coreClient = new x402Client().register("eip155:*", evmScheme);
      const httpClient = new x402HTTPClient(coreClient);

      const url = "http://localhost:3000/api/data";
      const response = await fetch(url);

      if (response.status === 402) {
        console.log("Payment required, processing via Kobaru...");

        const responseBody = await response.json();
        const paymentRequired = httpClient.getPaymentRequiredResponse(
          (name: string) => response.headers.get(name),
          responseBody
        );

        const paymentPayload = await httpClient.createPaymentPayload(
          paymentRequired
        );
        
        const paymentHeaders = httpClient.encodePaymentSignatureHeader(
          paymentPayload
        );

        const paidResponse = await fetch(url, {
          headers: { ...paymentHeaders },
        });

        const data = await paidResponse.json();
        console.log("Data received:", data);
      }
    }

    main();
    ```
  </Tab>
</Tabs>

Kobaru maintains an open-source cookbook with production-grade examples demonstrating real-world integrations:

**API Paywall Cookbook:**
[https://github.com/kobaru-io/api-paywall-cookbook](https://github.com/kobaru-io/api-paywall-cookbook)

***

## Troubleshooting

Kobaru provides detailed error messages and the Console shows real-time diagnostics. For common issues:

### Payment verification fails

| Issue                | Solution                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Invalid API key      | Verify `KOBARU_API_KEY` in console.kobaru.io                                                                         |
| Wrong network        | Ensure application uses `eip155:1187947933` (mainnet) or `eip155:324705682` (testnet)                                |
| Insufficient balance | User needs USDC on SKALE Base (bridge from Base)                                                                     |
| Expired signature    | Client must sign fresh payment (check `maxTimeoutSeconds`)                                                           |
| Wrong token address  | Use `0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20` (mainnet) or `0x2e08028E3C4c2356572E096d8EF835cD5C6030bD` (testnet) |

***

## Next steps

<CardGroup cols={2}>
  <Card title="SKALE Supported Facilitators" icon="dollar-sign" href="/get-started/agentic-builders/facilitators">
    Alternative hosted facilitator service
  </Card>

  <Card title="Run Your Own" icon="server" href="/cookbook/x402/facilitator">
    Deploy your own facilitator infrastructure
  </Card>

  <Card title="Accept Payments" icon="dollar-sign" href="/cookbook/x402/accepting-payments">
    Protect endpoints with payment middleware
  </Card>

  <Card title="Make Payments" icon="credit-card" href="/cookbook/x402/buying">
    Build clients that handle x402 payments
  </Card>
</CardGroup>

***

## Resources

* [Kobaru Documentation](https://docs.kobaru.io)
* [x402 Protocol Specification](https://x402.org)

***

<Note>
  This entity -- Kobaru -- is deployed and activley supporting SKALE. These are 3rd party services that may have their own terms and conditions and privacy polices. Use these services at your own risk. AI and agents is a highly experimental space; the 3rd party software solutions may have bugs or be unaudited. You and your agents and your customers use all 3rd party services chosen at your own risk and per their terms.
</Note>
