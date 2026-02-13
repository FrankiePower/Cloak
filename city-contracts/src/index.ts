import { WeatherClient } from "./client.js";

async function main() {
  console.log("Initializing Weather Client...\n");

  try {
      const client = await WeatherClient.create();
      console.log("Requesting weather forecast...\n");

      const result = await client.getWeather();

      if (result.success && result.data) {
        console.log(`Weather Forecast for ${result.data.data.city}:`);
        console.log("-".repeat(50));
        for (const day of result.data.data.forecast) {
          console.log(`  ${day.dayOfWeek} (${day.date}): ${day.condition} - ${day.minTemp}C to ${day.maxTemp}C`);
        }
        console.log("-".repeat(50));
        console.log(`Generated: ${result.data.timestamp}`);
      } else {
        console.error("Failed to get weather:", result.error);
      }
  } catch (err) {
      console.error("Global error:", err);
  }
}

main().catch(console.error);
