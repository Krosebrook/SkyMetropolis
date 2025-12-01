
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { AIGoal, BuildingType, CityStats, Grid, NewsItem } from "../../../types";
import { BUILDINGS } from "../../../config/constants";
import { AIServiceError, ValidationError } from "../../shared/errors/AppError";

// --- Configuration ---
const MODEL_ID = 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Validation Schemas (Zod) ---
const GoalResponseSchema = z.object({
  description: z.string().min(5).max(150),
  targetType: z.enum(['population', 'money', 'building_count']),
  targetValue: z.number().int().positive(),
  buildingType: z.enum([
    BuildingType.Residential, 
    BuildingType.Commercial, 
    BuildingType.Industrial, 
    BuildingType.Park, 
    BuildingType.Road
  ]).optional(),
  reward: z.number().int().positive(),
});

const NewsResponseSchema = z.object({
  text: z.string().min(5).max(100),
  type: z.enum(['positive', 'negative', 'neutral']),
});

// --- Gemini Schema Configs ---
const geminiGoalSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    targetType: { type: Type.STRING, enum: ['population', 'money', 'building_count'] },
    targetValue: { type: Type.INTEGER },
    buildingType: { 
      type: Type.STRING, 
      enum: [BuildingType.Residential, BuildingType.Commercial, BuildingType.Industrial, BuildingType.Park, BuildingType.Road] 
    },
    reward: { type: Type.INTEGER },
  },
  required: ['description', 'targetType', 'targetValue', 'reward'],
};

const geminiNewsSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
  },
  required: ['text', 'type'],
};

// --- Public API ---

export const generateCityGoal = async (stats: CityStats, grid: Grid): Promise<AIGoal | null> => {
  try {
    const counts: Record<string, number> = {};
    grid.flat().forEach(tile => {
      counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
    });

    const context = `
      Context:
      - Day: ${stats.day}
      - Treasury: $${stats.money}
      - Population: ${stats.population}
      - Building Counts: ${JSON.stringify(counts)}
      - Building Costs: ${JSON.stringify(
        Object.values(BUILDINGS).filter(b => b.type !== BuildingType.None).map(b => ({type: b.type, cost: b.cost}))
      )}
    `;

    const prompt = `Generate a strategic, achievable goal for the city mayor. Ensure the target value is slightly higher than current values to provide challenge. Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: geminiGoalSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      const validatedData = GoalResponseSchema.parse(rawData);
      return { ...validatedData, completed: false };
    }
    
    return null;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error in generateCityGoal:", error.errors);
      throw new ValidationError("AI returned invalid goal structure", { errors: error.errors });
    }
    console.error("AI Service Error:", error);
    // We suppress the error here to allow gameplay to continue without goals
    return null; 
  }
};

export const generateNewsEvent = async (stats: CityStats): Promise<NewsItem | null> => {
  try {
    const context = `City Stats - Pop: ${stats.population}, Money: ${stats.money}, Day: ${stats.day}.`;
    const prompt = "Generate a short, witty news headline about the city. Return valid JSON.";

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: geminiNewsSchema,
        temperature: 1.0,
      },
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      const validatedData = NewsResponseSchema.parse(rawData);
      
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        text: validatedData.text,
        type: validatedData.type,
      };
    }
    return null;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error in generateNewsEvent:", error.errors);
      // Suppress
    }
    console.error("AI Service Error (News):", error);
    return null;
  }
};
