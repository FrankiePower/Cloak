import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

type WeatherDay = {
  dayOfWeek: string;
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: "sunny" | "rainy";
};

type WeatherResponse = {
  city: string;
  forecast: WeatherDay[];
};

class WeatherAgent {
  private model: ChatAnthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }

    this.model = new ChatAnthropic({
      model: "claude-3-sonnet-20240229", // Updated to a known valid model
      temperature: 0.7,
      anthropicApiKey: apiKey,
    });

    console.log("[WeatherAgent] Initialized");
  }

  async getWeatherForecast(city: string): Promise<WeatherResponse> {
    console.log(`[WeatherAgent] Getting forecast for: ${city}`);

    const systemPrompt = `You are a weather forecast assistant. When asked about weather for a city, respond ONLY with a valid JSON object (no markdown, no explanation).

The JSON must have this exact structure:
{
  "city": "City Name",
  "forecast": [
    {
      "dayOfWeek": "Monday",
      "date": "December 16",
      "minTemp": 5,
      "maxTemp": 12,
      "condition": "sunny"
    }
  ]
}

Rules:
- Provide exactly 5 days starting from today
- dayOfWeek must be the full day name
- date must be in "Month Day" format
- minTemp and maxTemp must be integers in Celsius
- condition must be either "sunny" or "rainy"
- Make temperatures realistic for the city and season`;

    const userPrompt = `Get the weather forecast for ${city} for the next 5 days.`;

    try {
        const response = await this.model.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(userPrompt),
        ]);

        const content = response.content as string;
        const weatherData = JSON.parse(content) as WeatherResponse;

        console.log(`[WeatherAgent] Forecast generated for ${city}`);
        return weatherData;
    } catch (error) {
        console.warn(`[WeatherAgent] API call failed, returning mock data: ${error}`);
        return {
          city: city,
          forecast: [
            { dayOfWeek: "Monday", date: "Mock Date", minTemp: 10, maxTemp: 20, condition: "sunny" },
            { dayOfWeek: "Tuesday", date: "Mock Date", minTemp: 11, maxTemp: 21, condition: "rainy" },
            { dayOfWeek: "Wednesday", date: "Mock Date", minTemp: 12, maxTemp: 22, condition: "sunny" },
            { dayOfWeek: "Thursday", date: "Mock Date", minTemp: 13, maxTemp: 23, condition: "sunny" },
            { dayOfWeek: "Friday", date: "Mock Date", minTemp: 14, maxTemp: 24, condition: "rainy" }
          ]
        };
    }
  }
}

export default WeatherAgent;
