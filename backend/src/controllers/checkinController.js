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
        const { userId, email, isAnonymous, text, feeling, microJournaling, chatHistory, visualEmotion } = req.body;
        const checkinText = text || feeling;
        
        if (!checkinText) {
            return res.status(400).json({ error: 'Check-in text/feeling is required' });
        }

        const isStreaming = req.headers.accept?.includes('text/event-stream');
        console.log(`[SSE] New Request | UID: ${userId || 'anon'} | Stream: ${isStreaming}`);

        if (isStreaming) {
            // 🔥 STEP 2.1 — Start SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders(); 
        }

        const safeUserId = userId || `user-${Date.now()}`;

        // 🔥 MINDBLOWING: Contextual Empathy (Reference last sentiment)
        const history = await getRecentCheckIns(safeUserId);
        const lastCheckIn = history[0];
        let contextualContext = "";
        if (lastCheckIn) {
            contextualContext = `\n[CONTEXT] User's last check-in was at ${lastCheckIn.createdAt}. They were feeling ${lastCheckIn.riskLevel}. 
            If they are doing better now, celebrate. If worse, be extra supportive.`;
        }

        // 🔥 STEP 2.2 — Stream AI chunks & STEP 2.3 — Build fullResponse string
        console.log(`[SSE] Initiating AI processing for ${safeUserId}...`);
        const streamTarget = isStreaming ? res : null;
        const aiPayload = await generateDeepChatStream(checkinText + contextualContext, streamTarget, chatHistory || [], visualEmotion);
        
        // 🔥 STEP 2.4 — Capture metadata (intent, riskLevel, sentiment)
        const riskLevelUI = aiPayload.riskLevel; 
        const finalReply = aiPayload.reply;
        const fallbackIntent = aiPayload.intent;
        const geminiSentiment = aiPayload.sentimentScore !== undefined ? aiPayload.sentimentScore : 0;
        const copingStrategy = getCopingStrategy(fallbackIntent);

        console.log(`[SSE] AI Sequence Complete. Risk: ${riskLevelUI}, Sentiment: ${geminiSentiment}`);

        // 🔥 STEP 2.4.1 — Upsert User record
        try {
            await upsertUser({
                uid: safeUserId,
                email: email || null,
                isAnonymous: isAnonymous || false
            });
            console.log(`[SSE] User record upserted for ${safeUserId}`);
        } catch (uErr) {
            console.error('[SSE] USER UPSERT ERROR:', uErr.message);
        }

        // 🔥 STEP 2.5 — AFTER stream ends: Save to DB
        console.log(`[SSE] Persisting to MongoDB...`);
        let savedDocId = null;
        try {
            const checkinRecord = {
                userId: safeUserId,
                rawMessage: checkinText,
                journalWentWell: microJournaling?.wentWell || null,
                journalDrained: microJournaling?.drained || null,
                sentimentScore: geminiSentiment,
                intent: fallbackIntent,
                riskLevel: riskLevelUI,
                aiResponse: finalReply,
                visualEmotion: visualEmotion || null
            };

            const saved = await saveCheckIn(checkinRecord);
            savedDocId = saved?._id;

            if (riskLevelUI === 'Red') {
                await saveAlert(safeUserId, 'RISK_RED', `High-risk detected: ${checkinText}`);
            }
        } catch (dbError) {
            console.error('[SSE] DB SAVE ERROR:', dbError.message);
        }

        // 🔥 STEP 2.6 — Send final SSE chunk & call res.end()
        if (isStreaming) {
            res.write(`data: ${JSON.stringify({
                done: true,
                riskLevel: riskLevelUI,
                intent: fallbackIntent,
                copingStrategy,
                empathyEcho: aiPayload.empathyEcho,
                dbSaved: !!savedDocId
            })}\n\n`);
            res.end();
            console.log(`[SSE] Stream finalized for ${safeUserId}`);
        } else {
            res.status(200).json({
                success: true,
                analysis: {
                    sentiment: riskLevelUI.toLowerCase(),
                    highRiskDetected: riskLevelUI === 'Red',
                    copingStrategies: [copingStrategy],
                    dbSaved: !!savedDocId
                }
            });
        }
    } catch (error) {
        console.error('[SSE] FATAL CONTROLLER ERROR:', error);
        if (!res.headersSent) {
            if (req.headers.accept?.includes('text/event-stream')) {
                res.write(`data: ${JSON.stringify({ text: "Internal error processing request.", done: true })}\n\n`);
                res.end();
            } else {
                res.status(500).json({ error: 'Internal system error' });
            }
        }
    }
};

export const getHistory = async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        
        console.log(`[HISTORY] Fetching records for UID: ${userId}`);
        
        const history = await getRecentCheckIns(userId);
        
        console.log(`[HISTORY] Data fetched: ${history.length} entries`);
        if (history.length > 0) {
            console.log("[HISTORY] Sample sentiment:", history[0].sentimentScore);
        }

        res.status(200).json({ 
            success: true,
            data: history 
        });
    } catch (error) {
        console.error('[HISTORY] FAILED:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
