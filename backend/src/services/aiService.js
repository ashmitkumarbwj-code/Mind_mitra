import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeCheckInText = async (text) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
You are a clinical-grade mental health sentiment analyzer. Analyze the following message from a college student.
Return ONLY a valid JSON object with NO markdown, NO backticks, NO extra text.

The JSON must contain EXACTLY these fields:
{
  "sentimentScore": <integer from -2 (very negative) to +2 (very positive)>,
  "primaryIntent": "<one of: stress, anxiety, sadness, loneliness, burnout, anger, happiness, calm, neutral>",
  "riskKeywords": ["<array of high-risk phrases found in the text>"],
  "mediumRiskKeywords": ["<array of medium-risk phrases found in the text>"],
  "reasoning": "<one sentence explaining your classification>"
}

High-risk phrases to look for: "hopeless", "worthless", "can't continue", "empty inside", "tired of everything", "give up", "hurt myself", "no point", "end it"
Medium-risk phrases to look for: "stressed", "overwhelmed", "anxious", "can't sleep", "breaking down", "too much", "exhausted", "failing"

Scoring guide:
- +2: Excited, happy, great, amazing, wonderful
- +1: Good, fine, okay, decent, content
-  0: Neutral, nothing specific, just okay
- -1: Stressed, worried, sad, overwhelmed, anxious
- -2: Hopeless, very depressed, can't cope, crisis-level distress

Student message: "${text}"
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Strip any accidental markdown
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(responseText);

        const analysis = {
            sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
            primaryIntent: parsed.primaryIntent || 'neutral',
            riskKeywords: Array.isArray(parsed.riskKeywords) ? parsed.riskKeywords : [],
            mediumRiskKeywords: Array.isArray(parsed.mediumRiskKeywords) ? parsed.mediumRiskKeywords : [],
            reasoning: parsed.reasoning || ''
        };

        // Debug logging
        console.log('--- AI ANALYSIS RESULT ---');
        console.log('Sentiment Score:', analysis.sentimentScore);
        console.log('Primary Intent:', analysis.primaryIntent);
        console.log('High-Risk Keywords:', analysis.riskKeywords);
        console.log('Medium-Risk Keywords:', analysis.mediumRiskKeywords);
        console.log('Reasoning:', analysis.reasoning);
        console.log('--------------------------');

        return analysis;

    } catch (error) {
        console.error("Gemini Extraction Error:", error.message);
        return { sentimentScore: 0, primaryIntent: "neutral", riskKeywords: [], mediumRiskKeywords: [], reasoning: 'Analysis failed' };
    }
};

export const generateResponse = async (intent, riskLevel, copingStrategy, pastContext) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
You are a warm, supportive mental health companion for college students. You are NOT a therapist.
Do not diagnose. Do not be clinical. Speak naturally like a caring friend.

Student context:
- Primary emotion: ${intent}
- Risk level assessed: ${riskLevel}
- Suggested coping activity: ${copingStrategy}
- Past context: ${pastContext || 'This is their first check-in.'}

Tone guidelines:
- GREEN: Warm, encouraging, celebrate their effort in checking in.
- AMBER: Gentle, validating, softly suggest the coping activity without being pushy.
- RED: Sincere concern. Express care. Firmly but compassionately encourage them to speak to a real person or campus counselor. Provide iCall number: 9152987821.

Write a response of exactly 2-3 sentences. No hashtags. No bullet points. Just warm, direct sentences.
`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();

    } catch (error) {
        console.error("Gemini Response Error:", error.message);
        return "I hear you, and I appreciate you sharing. Please remember that your feelings are valid. If things get overwhelming, please reach out to iCall at 9152987821.";
    }
};
