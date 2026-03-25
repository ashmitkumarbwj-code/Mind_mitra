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
        console.log(`[CHECKIN] Request for UID: ${userId || 'anon'} (Stream: ${isStreaming})`);

        if (isStreaming) {
            // 1. Setup SSE Headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders(); 
        }

        const safeUserId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (safeUserId) {
            upsertUser({ uid: safeUserId, email: email || null, isAnonymous: isAnonymous || false }).catch(err => {
                console.warn('[CHECKIN] User upsert failed:', err.message);
            });
        }

        // 2. Process AI Response
        console.log(`[CHECKIN] Initiating AI processing for ${safeUserId}...`);
        
        // generateDeepChatStream handles the res.write internally IF res is provided
        const streamTarget = isStreaming ? res : null;
        const aiPayload = await generateDeepChatStream(checkinText, streamTarget, chatHistory || [], visualEmotion);
        
        const riskLevelUI = aiPayload.riskLevel; 
        const finalReply = aiPayload.reply;
        const fallbackIntent = aiPayload.intent;
        const geminiSentiment = aiPayload.sentimentScore !== undefined ? aiPayload.sentimentScore : 0;
        const copingStrategy = getCopingStrategy(fallbackIntent);

        // 3. Send Metadata/Response
        if (isStreaming) {
            res.write(`data: ${JSON.stringify({
                done: true,
                riskLevel: riskLevelUI,
                intent: fallbackIntent,
                copingStrategy,
                empathyEcho: aiPayload.empathyEcho
            })}\n\n`);
        }

        console.log(`[CHECKIN] Stream finished. Intent: ${fallbackIntent}, Risk: ${riskLevelUI}`);

        // 4. DB Storage: Ensure save finishes before ending the request lifecycle
        try {
            const checkinRecord = {
                userId: safeUserId,
                rawMessage: text,
                journalWentWell: microJournaling?.wentWell || null,
                journalDrained: microJournaling?.drained || null,
                sentimentScore: geminiSentiment,
                intent: fallbackIntent,
                riskLevel: riskLevelUI,
                aiResponse: finalReply,
                visualEmotion: visualEmotion || null
            };

            console.log(`[CHECKIN] Saving to MongoDB...`);
            const saved = await saveCheckIn(checkinRecord);
            console.log(`[CHECKIN] SUCCESS: Saved record ${saved._id}`);

            if (riskLevelUI === 'Red') {
                await saveAlert(safeUserId, 'RISK_RED', `High-risk detected for user: ${text}`);
                console.log(`[ALERT] HIGH RISK alert logged for ${safeUserId}`);
            }
        } catch (dbError) {
            console.error('[CHECKIN] DATABASE SAVE FAILED:', dbError.message);
            // Optionally send an error chunk if the stream is still open, 
            // but here we already sent 'done: true' and the client might have closed.
        }

        // 5. Finalize Response
        if (isStreaming) {
            res.end();
        } else {
            // Format to match Dashboard.jsx expectation: response.data.analysis
            res.status(200).json({
                success: true,
                analysis: {
                    sentiment: riskLevelUI.toLowerCase(),
                    highRiskDetected: riskLevelUI === 'Red',
                    counselorMessage: riskLevelUI === 'Red' ? "Please contact professional support" : null,
                    copingStrategies: [copingStrategy],
                    intent: fallbackIntent
                }
            });
        }
        console.log(`[CHECKIN] Request lifecycle completed for ${safeUserId}`);

    } catch (error) {
        console.error('[CHECKIN] CRITICAL ERROR:', error);
        res.write(`data: ${JSON.stringify({ text: "I'm having trouble processing your check-in. Please try again in a moment." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true, riskLevel: "Amber", intent: "stress" })}\n\n`);
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
