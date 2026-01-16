
import { GoogleGenAI, Type } from "@google/genai";
import { AIMoveResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getBestMove(fen: string, history: string[]): Promise<AIMoveResponse> {
  const model = ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the following chess position (FEN) and provide the best move for the current player.
    FEN: ${fen}
    Last moves: ${history.slice(-10).join(', ')}
    
    You are a Grandmaster. Respond with the best move in Standard Algebraic Notation (SAN) or UCI format (e.g., 'e4', 'Nf3', 'e2e4').
    Explain briefly why this is the best move.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          move: {
            type: Type.STRING,
            description: "The recommended move in SAN or UCI format.",
          },
          explanation: {
            type: Type.STRING,
            description: "Brief grandmaster reasoning.",
          },
        },
        required: ["move", "explanation"],
      },
      thinkingConfig: { thinkingBudget: 2000 }
    },
  });

  const response = await model;
  const jsonStr = response.text.trim();
  try {
    return JSON.parse(jsonStr) as AIMoveResponse;
  } catch (e) {
    console.error("Failed to parse AI response:", jsonStr);
    return { move: "", explanation: "I couldn't calculate a move right now." };
  }
}
