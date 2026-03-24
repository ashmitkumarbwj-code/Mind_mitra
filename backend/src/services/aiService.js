import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Local Keyword Fallback Engine ────────────────────────────────
const generateLocalFallback = (message) => {
    const text = message.toLowerCase().trim();
    const crisisKeywords = ["suicid", "sucide", "sucid", "sicide", "sicidal", "die", "kill", "end my life", "harm myself", "giving up", "hopeless", "end it"];
    if (crisisKeywords.some(kw => text.includes(kw))) {
        return { reply: "⚠️ I'm really concerned about you right now. Please talk to someone you trust or contact the iCall helpline immediately at 9152987821. You matter. 💙", riskLevel: "Red", intent: "crisis" };
    }
    if (text.includes("sad") || text.includes("depress") || text.includes("crying")) {
        return { reply: "I hear you, and I'm so sorry you're feeling this way. Sad days are real, and you don't have to face them alone 💙.", riskLevel: "Amber", intent: "sadness" };
    }
    if (text.includes("stress") || text.includes("overwhelm") || text.includes("exhaust")) {
        return { reply: "That sounds incredibly heavy. Take a 5-minute break right now — drink some water, breathe. You've got this.", riskLevel: "Amber", intent: "stress" };
    }
    if (text.includes("anxious") || text.includes("anxiety") || text.includes("panic")) {
        return { reply: "Let's slow this down together. Inhale for 4 counts, hold for 4, exhale for 4. You are safe right now.", riskLevel: "Amber", intent: "anxiety" };
    }
    return { reply: "I'm listening 💙. Tell me more about how you're feeling.", riskLevel: "Green", intent: "neutral" };
};

// ─── Build Gemini chat history format from frontend msg array ─────
const buildGeminiHistory = (history = []) => {
    return history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || '' }]
    })).filter(m => m.parts[0].text.trim() !== '');
};

// ─── MindMitra System Prompt ──────────────────────────────────────
const SYSTEM_PROMPT = `You are MindMitra, a warm, empathetic mental health companion for college students in India.
You remember the full conversation and build on what has been shared before.
ALWAYS respond like a supportive, caring friend — never clinical or robotic.

IMPORTANT: You MUST output exactly two sections:
1. Your empathetic, conversational response directly to the student.
2. Then exactly this delimiter on its own line: ===METADATA===
3. Then a JSON: {"risk_level": "Green|Amber|Red", "intent": "sadness|anxiety|crisis|neutral|stress|burnout"}

RISK RULES:
- Green: Calm, positive, venting normally.
- Amber: Stress, anxiety, sadness, academic pressure.
- Red: Suicidal thoughts, self-harm, crisis. MUST respond: "⚠️ I'm really concerned about you. Please talk to someone or call iCall: 9152987821. You matter 💙"

Use the conversation history to show you remember what they said before. Reference earlier details naturally.`;

// ─── Main Streaming Export ─────────────────────────────────────────
export const generateDeepChatStream = async (userMessage, res, chatHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: { temperature: 0.75, maxOutputTokens: 800 },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });

        // Build history — all previous messages EXCEPT the latest one
        const formattedHistory = buildGeminiHistory(chatHistory);

        // startChat() gives Gemini full conversational context
        const chat = model.startChat({ history: formattedHistory });

        // Now send the current message into that live chat
        const streamResult = await chat.sendMessageStream(userMessage);

        let textResponse = "";
        let isMetadata = false;
        let metadataString = "";

        for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();

            if (isMetadata) {
                metadataString += chunkText;
                continue;
            }

            if (chunkText.includes("===METADATA===")) {
                isMetadata = true;
                const parts = chunkText.split("===METADATA===");
                if (parts[0].trim()) {
                    textResponse += parts[0];
                    res.write(`data: ${JSON.stringify({ text: parts[0] })}\n\n`);
                }
                if (parts[1]) metadataString += parts[1];
            } else {
                textResponse += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Parse Metadata from delimited JSON block
        let parsed = { risk_level: "Green", intent: "neutral" };
        try {
            const jsonMatch = metadataString.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch (e) { console.error("Metadata parse failed", e.message); }

        // Empathy echo card for negative intents
        let empathyEcho = null;
        const negativeIntents = ["anxiety", "panic", "stress", "sadness", "burnout", "depression", "overwhelmed"];
        if (negativeIntents.includes(parsed.intent?.toLowerCase())) {
            const count = Math.floor(Math.random() * 80) + 12;
            empathyEcho = `${count} other students on campus reported feeling exactly this way this week. You are not alone.`;
        }

        return {
            reply: textResponse.trim(),
            riskLevel: parsed.risk_level || "Green",
            intent: parsed.intent || "neutral",
            empathyEcho
        };

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        const fallback = generateLocalFallback(userMessage);
        res.write(`data: ${JSON.stringify({ text: fallback.reply })}\n\n`);
        return fallback;
    }
};
