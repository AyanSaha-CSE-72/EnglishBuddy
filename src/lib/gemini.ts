import { GoogleGenAI, Type } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function analyzeSession(transcript: { text: string, type: 'user' | 'model' }[]) {
  const conversation = transcript
    .map(t => `${t.type === 'user' ? 'Student' : 'ProfX'}: ${t.text}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this English learning conversation and provide a progress report.
Conversation:
${conversation}`,
    config: {
      systemInstruction: "You are an English Language Specialist. Evaluate the student's performance in grammar, vocabulary, fluency, and pacing/rhythm (0-100). Provide a summary in Bengali and English. List key improvements and vocabulary suggestions.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grammarScore: { type: Type.NUMBER },
          vocabularyScore: { type: Type.NUMBER },
          fluencyScore: { type: Type.NUMBER },
          pacingScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          keyImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
          vocabularySuggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                suggested: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["original", "suggested", "reason"]
            }
          }
        },
        required: ["grammarScore", "vocabularyScore", "fluencyScore", "pacingScore", "summary", "keyImprovements", "vocabularySuggestions"]
      }
    }
  });

  return JSON.parse(response.text);
}
