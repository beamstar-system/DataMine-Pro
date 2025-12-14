import { GoogleGenAI } from "@google/genai";
import { DatasetRow, GeneratorConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract JSON from potentially markdown-wrapped responses
function extractJson(text: string): any[] {
  try {
    // First attempt: direct parse
    return JSON.parse(text);
  } catch (e) {
    // Second attempt: extract from markdown code blocks
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        console.error("Failed to parse JSON from markdown block", e2);
      }
    }
    
    // Third attempt: find first [ and last ]
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch (e3) {
        console.error("Failed to parse JSON via substring", e3);
      }
    }
    
    throw new Error("Could not parse dataset from response.");
  }
}

export const generateDatasetBatch = async (
  config: GeneratorConfig,
  currentData: DatasetRow[] = []
): Promise<{ data: DatasetRow[], sources: string[] }> => {
  
  const columnNames = config.columns.map(c => c.name).join(", ");
  const contextStr = config.context ? `Additional Context: ${config.context}` : "";
  const existingDataStr = currentData.length > 0 
    ? `Do not duplicate these existing entries: ${JSON.stringify(currentData.map(d => Object.values(d)[0]).slice(-5))}` 
    : "";

  const prompt = `
    You are an expert Data Engineer tasked with creating a high-value, real-world dataset.
    
    Topic: ${config.topic}
    ${contextStr}
    
    Required Columns: ${columnNames}
    
    Task:
    1. Use Google Search to find REAL, factual data points related to the topic.
    2. Generate ${config.rowCount} NEW, distinct rows of data.
    3. Ensure data is accurate and up-to-date based on search results.
    4. ${existingDataStr}
    
    Output Format:
    Return ONLY a raw JSON array of objects. Each object must have keys corresponding exactly to the requested columns.
    Do not include markdown formatting like \`\`\`json. Just the raw array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash for speed, but supports search
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed with googleSearch
        // We must rely on the prompt for JSON structure.
      },
    });

    const text = response.text || "[]";
    const newData = extractJson(text);

    // Validate structure roughly
    if (!Array.isArray(newData)) {
        // If it's not an array, try to wrap it if it looks like a single object, otherwise fail
        throw new Error("Response was not a JSON array");
    }

    // Extract sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: string | undefined) => !!uri) as string[];

    return { data: newData, sources: [...new Set(sources)] }; // Unique sources
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};