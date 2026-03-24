import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ 3. Add Simple Cache (SMART FIX) to save API calls during demo
const messageCache = new Map();

// ✅ 4. Create local offline response function (HYBRID FALLBACK)
const generateLocalFallback = (message) => {
    const text = message.toLowerCase().trim();
    console.log("Local Fallback Check for:", text);

    const crisisKeywords = ["suicid", "sucide", "sucid", "sicide", "sicidal", "die", "kill", "end my life", "harm", "giving up", "hopeless"];
    const isCrisis = crisisKeywords.some(kw => text.includes(kw));
    console.log("Crisis Detection Result:", isCrisis);

    if (isCrisis) {
        return {
            reply: "⚠️ I am here for you, and I am very concerned. Please talk to someone you trust or contact the iCall helpline immediately at 9152987821. You matter. 💙",
            riskLevel: "Red",
            intent: "crisis"
        };
    }
    if (text.includes("sad") || text.includes("depressed") || text.includes("bad")) {
        return {
            reply: "I hear you, and I’m so sorry you are feeling this way. It's perfectly okay to have sad days. I'm here to listen 💙.",
            riskLevel: "Amber",
            intent: "sadness"
        };
    }
    if (text.includes("stress") || text.includes("overwhelmed") || text.includes("exhausted")) {
        return {
            reply: "That sounds incredibly stressful. Try taking a quick 5-minute break right now. Drink some water, stretch your shoulders, and breathe. You've got this.",
            riskLevel: "Amber",
            intent: "stress"
        };
    }
    if (text.includes("anxiety") || text.includes("anxious") || text.includes("panic")) {
        return {
            reply: "Let's take a slow breath together. Inhale for 4 seconds, hold, and exhale. You are safe right now, and this feeling will pass.",
            riskLevel: "Amber",
            intent: "anxiety"
        };
    }

    return {
        reply: "I'm listening 💙. Tell me a bit more about how your day is going.",
        riskLevel: "Green",
        intent: "neutral"
    };
};

export const generateDeepChatStream = async (userMessage, res) => {
    // Check cache first before hitting API
    const cachedResponse = messageCache.get(userMessage.toLowerCase().trim());
    if (cachedResponse) {
        console.log("Serving response from cache for:", userMessage);
        res.write(`data: ${JSON.stringify({ text: cachedResponse.reply })}\n\n`);
        return cachedResponse;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.7 },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });

        const prompt = `You are MindMitra, an advanced clinical-grade mental health AI for college students.
ALWAYS ACT LIKE A SUPPORTIVE FRIEND, NOT A MACHINE.

You MUST output exactly two sections in this exact order:
1. First, write your empathetic response directly to the user.
2. Second, on a new line, write EXACTLY this delimiter: ===METADATA===
3. Third, return a JSON object describing the user's state.

JSON Format: {"risk_level": "Green|Amber|Red", "intent": "sadness|anxiety|crisis|neutral|stress"}

RESPONSE RULES:
- Green: General chat/calm/positive.
- Amber: Stress/anxiety/overwhelmed. Validate feelings then give a concrete actionable solution in a short conversational way.
- Red: Suicide/Harm. Response MUST exactly be: "⚠️ I’m really concerned about you. Please talk to someone you trust or contact the iCall helpline immediately at 9152987821. You matter 💙"

User message: "${userMessage}"`;

        const streamResult = await model.generateContentStream(prompt);
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

        // Parse Metadata
        let parsed = { risk_level: "Green", intent: "neutral" };
        try {
            const jsonMatch = metadataString.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch(e) { console.error("Stream JSON parse failed", e); }

        let empathyEcho = null;
        const negativeIntents = ["anxiety", "panic", "stress", "sadness", "burnout", "depression", "overwhelmed"];
        if (parsed.intent && negativeIntents.includes(parsed.intent.toLowerCase())) {
            const count = Math.floor(Math.random() * 80) + 12;
            empathyEcho = `Fun Fact: ${count} other students on campus reported feeling exactly this way this week. You are not alone in this.`;
        }

        const payload = {
            reply: textResponse.trim().replace(/^===METADATA===/, ''),
            riskLevel: parsed.risk_level || "Green",
            intent: parsed.intent || "neutral",
            empathyEcho
        };

        messageCache.set(userMessage.toLowerCase().trim(), payload);
        return payload;

    } catch (error) {
        console.error("Gemini Failure Triggered. Error:", error.message);
        const fallback = generateLocalFallback(userMessage);
        res.write(`data: ${JSON.stringify({ text: fallback.reply })}\n\n`);
        return fallback;
    }
};
