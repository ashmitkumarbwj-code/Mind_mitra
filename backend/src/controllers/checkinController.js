import { generateDeepChatStream } from '../services/aiService.js';
import { evaluateRisk, getCopingStrategy } from '../services/riskEngine.js';
import { saveCheckIn, getRecentCheckIns, upsertUser, updateEmergencyContact, saveCopingLog, saveAlert } from '../services/dbService.js';

export const logCopingAction = async (req, res) => {
    try {
        const { userId, intent, strategy } = req.body;
        if (!userId || !intent) {
            return res.status(400).json({ error: 'User ID and Intent are required' });
        }
        const savedLog = await saveCopingLog(userId, intent, strategy);
        res.status(201).json({ message: 'Action logged', data: savedLog });
    } catch (error) {
        res.status(500).json({ error: 'Failed to log action' });
    }
};

export const updateContact = async (req, res) => {
    try {
        const { userId, name, phone } = req.body;
        if (!userId || !name || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const updatedUser = await updateEmergencyContact(userId, name, phone);
        res.status(200).json({ message: 'Emergency contact updated successfully', data: updatedUser });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
};

export const submitCheckIn = async (req, res) => {
    try {
        const { userId, email, isAnonymous, text, microJournaling, chatHistory, visualEmotion } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Check-in text is required' });
        }

        // Setup SSE Headers for Real-Time Streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); 

        const safeUserId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (safeUserId) {
            upsertUser({ uid: safeUserId, email: email || null, isAnonymous: isAnonymous || false }).catch(()=>{});
        }

        // Pass chatHistory (all previous messages) for conversational memory + webcam emotion
        const aiPayload = await generateDeepChatStream(text, res, chatHistory || [], visualEmotion);
        
        const riskLevelUI = aiPayload.riskLevel; // "Green", "Amber", "Red"
        const finalReply = aiPayload.reply;
        const fallbackIntent = aiPayload.intent;

        // 2. Use Gemini Sentiment if available, else zero
        const geminiSentiment = aiPayload.sentimentScore !== undefined ? aiPayload.sentimentScore : 0;
        const copingStrategy = getCopingStrategy(fallbackIntent);

        // 3. Finalize Stream with UI Action Metadata
        res.write(`data: ${JSON.stringify({
            done: true,
            riskLevel: riskLevelUI,
            intent: fallbackIntent,
            copingStrategy,
            empathyEcho: aiPayload.empathyEcho
        })}\n\n`);
        res.end();

        // 4. DB Storage (Wait for save to ensure data integrity)
        try {
            const checkinRecord = {
                user_id: safeUserId,
                raw_message: text,
                journal_went_well: microJournaling?.wentWell || null,
                journal_drained: microJournaling?.drained || null,
                sentiment_score: geminiSentiment,
                intent: fallbackIntent,
                risk_level: riskLevelUI,
                ai_response: finalReply,
                visual_emotion: visualEmotion || null
            };

            console.log(`[CHECKIN] Saving data for ${safeUserId}:`, riskLevelUI);
            
            const saved = await saveCheckIn(checkinRecord);
            console.log(`[CHECKIN] Successfully saved to DB: ${saved._id}`);

            if (riskLevelUI === 'Red') {
                await saveAlert(safeUserId, 'RISK_RED', `High-risk detected for user: ${text}`);
                console.log(`[ALERT] High-risk alert logged for ${safeUserId}`);
            }
        } catch (dbError) {
            console.error('[CHECKIN] Database save FAILED:', dbError.message);
        }

    } catch (error) {
        console.error('Critical Error in submitCheckIn:', error);
        res.write(`data: ${JSON.stringify({ text: "I'm experiencing a high volume of traffic right now and my connection is a bit slow. Please wait a moment and try again." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true, riskLevel: "Amber", intent: "stress", copingStrategy: "Take a deep breath. Close your eyes for 30 seconds." })}\n\n`);
        res.end();
    }
};

export const getHistory = async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        const history = await getRecentCheckIns(userId);
        res.status(200).json({ data: history });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
