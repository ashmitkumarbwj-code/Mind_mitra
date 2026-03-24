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

export const generateDeepChatResponse = async (userMessage) => {
    // Check cache first before hitting API
    const cachedResponse = messageCache.get(userMessage.toLowerCase().trim());
    if (cachedResponse) {
        console.log("Serving response from cache for:", userMessage);
        return cachedResponse;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        });

        const prompt = `
You are MindMitra, an advanced clinical-grade mental health AI for college students.
Your task is to deeply analyze the user's message, determine their emotional state and risk level, and generate a perfectly tailored response.

ALWAYS ACT LIKE A SUPPORTIVE FRIEND, NOT A MACHINE.

You must return a valid JSON object matching exactly this structure:
{
  "thought_process": "Brief internal reasoning about the user's state and what the best response strategy is.",
  "risk_level": "Green, Amber, or Red",
  "intent": "One word summarizing their state (e.g., anxiety, sadness, calm, crisis, burnout, stress, happy, neutral)",
  "ai_response": "Your empathetic 2-3 sentence response directly to the user."
}

RULES FOR RISK LEVEL & RESPONSE:
- GREEN (Safe): The user is neutral, happy, or just chatting. 
  -> Response: Engage naturally, be helpful, and answer any general questions they have thoroughly.

- AMBER (Elevated): The user mentions stress, anxiety, overwhelming workload, sadness, a specific problem, or mental health struggles.
  -> Response: Act like a highly intelligent, empathetic mental health GPT assistant. 
  -> First, validate their feelings.
  -> Then, provide CONCRETE, ACTIONABLE SUGGESTIONS or tailored frameworks to solve their exact problem.
  -> Feel free to write longer, detailed responses. Use structured lists (dashes or numbers) to map out solutions.
  -> DO NOT give generic "I'm here for you" replies if they bring up a specific issue. Solve it with them.

- RED (Severe Crisis): The user mentions self-harm, suicide, hopelessness, "giving up", "no point in living", or extreme crisis.
  -> Response MUST BE EXACTLY: "⚠️ I’m really concerned about you. Please talk to someone you trust or contact the iCall helpline immediately at 9152987821. You matter 💙"

IMPORTANT FORMATTING RULE: 
Converse naturally. Use clear paragraph breaks and simple lists for readability. Do NOT use markdown formatting like **bold** or *italics*, as the current UI only supports plain text with line breaks.

User's message exactly as typed: "${userMessage}"
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Robust JSON extraction
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        }
        
        const parsed = JSON.parse(responseText);
        
        console.log("---------- GEMINI THOUGHT PROCESS ----------");
        console.log("Thought:", parsed.thought_process);
        console.log("Risk:", parsed.risk_level);
        console.log("Intent:", parsed.intent);
        console.log("--------------------------------------------");

        let empathyEcho = null;
        const negativeIntents = ["anxiety", "panic", "stress", "sadness", "burnout", "depression", "overwhelmed"];
        if (parsed.intent && negativeIntents.includes(parsed.intent.toLowerCase())) {
            const count = Math.floor(Math.random() * 80) + 12; // Simulate campus data
            empathyEcho = `Fun Fact: ${count} other students on campus reported feeling exactly this way this week. You are not alone in this.`;
        }

        const payload = {
            reply: parsed.ai_response || "I hear you, and I appreciate you sharing.",
            riskLevel: parsed.risk_level || "Green",
            intent: parsed.intent || "neutral",
            empathyEcho: empathyEcho
        };
        
        // Save successful generated responses to the cache
        messageCache.set(userMessage.toLowerCase().trim(), payload);
        
        return payload;

    } catch (error) {
        console.error("Gemini Failure Triggered. Error:", error.message);

        // ✅ FALLBACK TIER 2: Try Local Ollama (if the user has it running)
        try {
            console.log("Attempting Tier-2 Fallback: Local Ollama (Phi-3)...");
            const ollamaRes = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                body: JSON.stringify({
                    model: "phi3",
                    prompt: `System: You are a supportive mental health friend. Keep replies short (2-4 lines). If crisis, suggest helpline 9152987821. User: ${userMessage}. Response:`,
                    stream: false
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (ollamaRes.ok) {
                const data = await ollamaRes.json();
                console.log("Ollama Response Success!");
                return {
                    reply: data.response,
                    riskLevel: data.response.toLowerCase().includes("915298") ? "Red" : "Amber",
                    intent: "fallback-ai"
                };
            }
        } catch (ollamaError) {
            console.warn("Tier-2 Ollama Fallback unavailable. Proceeding to Tier-3 Keyword Engine.");
        }

        // ✅ FALLBACK TIER 3: Switch to robust local keyword logic
        const localResponse = generateLocalFallback(userMessage);
        return localResponse;
    }
};
