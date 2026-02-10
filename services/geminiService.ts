import { GoogleGenAI, Type } from "@google/genai";
import { Deck, FlashcardData } from "../types";

let aiInstance: GoogleGenAI | null = null;

// Lazy load AI instance
const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return aiInstance;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative title for this deck" },
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          simplified: { type: Type.STRING, description: "The word in Simplified Chinese" },
          traditional: { type: Type.STRING, description: "The word in Traditional Chinese" },
          pinyin: { type: Type.STRING, description: "Pinyin with proper tone marks" },
          english: { type: Type.STRING, description: "English definition" },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                simplified: { type: Type.STRING, description: "Example sentence in Simplified Chinese" },
                traditional: { type: Type.STRING, description: "Example sentence in Traditional Chinese" },
                pinyin: { type: Type.STRING, description: "Pinyin for the example sentence" },
                english: { type: Type.STRING }
              },
              required: ["simplified", "traditional", "pinyin", "english"]
            }
          }
        },
        required: ["simplified", "traditional", "pinyin", "english", "examples"]
      }
    }
  },
  required: ["title", "cards"]
};

const SYSTEM_INSTRUCTION = `You are an expert Chinese language teacher. 
Your task is to generate a comprehensive vocabulary list suitable for flashcards.
For each word, provide:
1. Simplified Chinese characters.
2. Traditional Chinese characters.
3. Pinyin with tone marks for the word.
4. English definition.
5. Example sentences:
   - If the user provided a specific phrase or sentence for the word, use ONLY that phrase. Do NOT generate additional examples.
   - If the user provided only the word, generate 2 natural, relevant example sentences.
   - For EACH example, provide:
     - The sentence in Simplified Chinese.
     - The sentence in Traditional Chinese.
     - The Pinyin.
     - The English translation.

Ensure the examples are natural and relevant to the context.`;

export const generateDeck = async (topic: string): Promise<Deck> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate a list of 10-15 vocabulary words related to the topic: "${topic}".`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    return parseResponse(response);
  } catch (error) {
    console.error("Error generating deck:", error);
    throw error;
  }
};

export const generateDeckFromList = async (content: string): Promise<Deck> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Create a detailed flashcard deck based on the following list of words and optional example phrases provided by the user.
  
  User Input:
  """
  ${content}
  """
  
  Instructions:
  1. Parse the input. Each line represents a card. 
  2. The line might be just a word (e.g., "苹果") or a word with an example (e.g., "苹果: 我爱吃苹果").
  3. If an example is provided by the user, you MUST use it EXACTLY as the example sentence. Do NOT generate any other examples for this card. Do NOT modify the Chinese characters of the user's example. Provide Pinyin and an English translation for it.
  4. If the input is English, translate it to Chinese and treat it as the target word.
  5. Provide all missing fields (Traditional, Pinyin for word, Pinyin for examples, Definition).
  6. Set the deck title based on the content (e.g., "Custom Vocabulary List").
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    return parseResponse(response);
  } catch (error) {
    console.error("Error generating deck from list:", error);
    throw error;
  }
};

const parseResponse = (response: any): Deck => {
  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");

  const data = JSON.parse(jsonText);

  // Add unique IDs to cards
  const cardsWithIds: FlashcardData[] = data.cards.map((card: any, index: number) => ({
    ...card,
    id: `card-${Date.now()}-${index}`
  }));

  return {
    title: data.title,
    cards: cardsWithIds
  };
};