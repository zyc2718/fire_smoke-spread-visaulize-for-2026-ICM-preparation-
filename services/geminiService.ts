import { GoogleGenAI } from "@google/genai";
import { SimulationStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSafety = async (stats: SimulationStats): Promise<string> => {
  try {
    const prompt = `
      You are an advanced Fire Safety Officer AI. Analyze the following real-time building simulation data:

      - Total Active Fire Cells: ${stats.activeFireCells}
      - Total Smoke Mass Index: ${stats.totalSmokeMass.toFixed(1)}
      - Average Building Temp: ${stats.averageTemperature.toFixed(1)}°C
      - Floor Danger Levels (0-100): ${JSON.stringify(stats.floorStats)}

      Provide a concise, tactical status report (max 3 sentences). 
      Identify the most critical floor.
      Suggest one immediate evacuation or containment action.
      Format as HTML string with bold tags for emphasis.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI Connection Offline. Proceed with manual protocols.";
  }
};
