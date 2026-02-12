import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import WeatherAgent from "./agent.js";
import "dotenv/config";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3001;

app.use("*", cors());

let agent: WeatherAgent | null = null;

async function initializeAgent() {
  try {
    agent = new WeatherAgent();
    console.log("[Server] Weather agent initialized");
  } catch (error) {
    console.warn("[Server] Agent initialization failed:", error);
  }
}

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    agentInitialized: agent !== null,
  });
});

async function setupWeatherRoute() {
  const facilitatorUrl = process.env.FACILITATOR_URL;
  const receivingAddress = process.env.RECEIVING_ADDRESS as `0x${string}`;
  const networkChainId = process.env.NETWORK_CHAIN_ID || "324705682";
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}`;
  const paymentTokenName = process.env.PAYMENT_TOKEN_NAME || "Axios USD";

  if (!facilitatorUrl || !receivingAddress || !paymentTokenAddress) {
    console.warn("[Server] Payment middleware not configured");
    app.get("/api/weather", (c) => {
      return c.json({ error: "Payment middleware not configured" }, 503);
    });
    return;
  }

  const network: Network = `eip155:${networkChainId}`;

  // Initialize facilitator client
  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register("eip155:*", new ExactEvmScheme());

  // Configure payment middleware for the weather endpoint
  app.use(
    paymentMiddleware(
      {
        "GET /api/weather": {
          accepts: [
            {
              scheme: "exact",
              network: network,
              payTo: receivingAddress,
              price: {
                amount: "10000", // 0.01 tokens (6 decimals)
                asset: paymentTokenAddress,
                extra: {
                  name: paymentTokenName,
                  version: "1",
                },
              },
            },
          ],
          description: "AI Weather Forecast - 5 day forecast",
          mimeType: "application/json",
        },
      },
      resourceServer
    )
  );

  // Protected weather endpoint
  app.get("/api/weather", async (c) => {
    if (!agent) {
      return c.json({ error: "Agent not initialized" }, 503);
    }

    const city = "London"; // Hardcoded for demo

    console.log(`[Server] Generating forecast for: ${city}`);

    try {
      const forecast = await agent.getWeatherForecast(city);

      return c.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: forecast,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: message }, 500);
    }
  });

  console.log("[Server] Weather route configured with x402 payment protection");
}

async function startServer() {
  await initializeAgent();
  await setupWeatherRoute();

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Weather endpoint: GET /api/weather (payment required)`);
  });
}

startServer();
