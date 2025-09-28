import { GoogleGenAI, Type } from "@google/genai";
import type { User, Match } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

export async function getProjectIdeas(
  skills: string,
  interests: string
): Promise<string[]> {
  const prompt = `You are an expert hackathon mentor. A student has the following skills: "${skills}" and interests: "${interests}". Generate 3 concise and innovative project ideas for a hackathon like ShellHacks. Respond in a JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const ideas = JSON.parse(jsonString);
    return ideas as string[];
  } catch (error) {
    console.error("Error generating project ideas:", error);
    throw new Error("Failed to get project ideas from Gemini API.");
  }
}

export async function findTopMatches(
  currentUser: User,
  availableUsers: User[]
): Promise<Match[]> {
  const prompt = `
    You are an expert team builder for hackathons. Your task is to find the best teammates for a user based on skill synergy, shared interests, and complementary project ideas from their bio.

    The event is ShellHacks, and the team size limit is 4.

    Here is the profile of the user seeking a team (note their name is 'fullName' and project ideas are in 'bio'):
    ${JSON.stringify(currentUser)}

    Here is a list of available participants (note their names are 'fullName' and project ideas are in 'bio'):
    ${JSON.stringify(availableUsers)}

    Analyze the list and return the top 3 best matches for the user. For each match, provide a brief, one-sentence justification explaining why they are a good fit. Do not match the user with themselves. Ensure the returned 'id' for each match corresponds exactly to the id from the provided participant list and that you return 'fullName'.
    `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              // FIX: Ensure the id type is consistently handled as a string.
              id: { type: Type.STRING },
              fullName: { type: Type.STRING },
              major: { type: Type.STRING },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              justification: { type: Type.STRING },
            },
            required: ["id", "fullName", "major", "skills", "justification"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const matches = JSON.parse(jsonString);
    return matches as Match[];
  } catch (error) {
    console.error("Error finding top matches:", error);
    throw new Error("Failed to get matches from Gemini API.");
  }
}
