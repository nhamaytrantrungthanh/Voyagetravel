import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PlanItem {
  time: string;
  activity: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
}

export interface DayTripPlan {
  destination: string;
  summary: string;
  itinerary: PlanItem[];
  tips: string[];
}

export async function generateItinerary(destination: string, duration: string, interests: string): Promise<DayTripPlan> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Plan a ${duration} trip to ${destination} focused on ${interests}. 
    Provide a detailed itinerary with times, activities, and specific locations (names and lat/lng coordinates). 
    Also include general travel tips for this area.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          summary: { type: Type.STRING },
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                activity: { type: Type.STRING },
                description: { type: Type.STRING },
                location: {
                  type: Type.OBJECT,
                  properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                    name: { type: Type.STRING },
                  },
                  required: ["lat", "lng", "name"]
                }
              },
              required: ["time", "activity", "description"]
            }
          },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["destination", "summary", "itinerary", "tips"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    throw new Error("Failed to generate itinerary. Please try again.");
  }
}
