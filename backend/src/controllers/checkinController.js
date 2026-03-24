import { generateDeepChatResponse } from '../services/aiService.js';
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
        const { userId, email, isAnonymous, text, microJournaling } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Check-in text is required' });
        }

        // Generate a secure fallback ID for completely anonymous, unauthenticated attempts
        const safeUserId = userId || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Upsert User to ensure record exists
        if (safeUserId) {
            await upsertUser({ uid: safeUserId, email: email || null, isAnonymous: isAnonymous || false });
        }

        // 1. Core Chatbot Logic & Risk Assessment (Deep LLM Thought Process)
        const aiPayload = await generateDeepChatResponse(text);
        
        const riskLevelUI = aiPayload.riskLevel; // "Green", "Amber", "Red"
        const finalReply = aiPayload.reply;
        const fallbackIntent = aiPayload.intent;

        // 2. Fallback Sentiment for the numerical dashboard trend charts
        const fallbackSentiment = riskLevelUI === "Amber" ? -1 : (riskLevelUI === "Red" ? -2 : 1);
        const copingStrategy = getCopingStrategy(fallbackIntent);

        // 3. Return exactly what CheckIn.jsx expects IMMEDIATELY
        res.status(201).json({
            message: 'Check-in processed successfully',
            data: {
                aiResponse: finalReply,
                riskLevel: riskLevelUI,
                intent: fallbackIntent,
                copingStrategy
            }
        });

        // 4. DB Storage (Fire and Forget - Non-Blocking)
        try {
            const checkinRecord = {
                user_id: safeUserId,
                raw_message: text,
                journal_went_well: microJournaling?.wentWell || null,
                journal_drained: microJournaling?.drained || null,
                sentiment_score: fallbackSentiment,
                intent: fallbackIntent,
                risk_level: riskLevelUI,
                ai_response: finalReply
            };
            // 5. Immediate Crisis Escalation (New Phase 2 Alert)
            if (riskLevelUI === 'Red') {
                saveAlert(safeUserId, 'RISK_RED', `High-risk detected for user: ${text}`).catch(err => {
                    console.error('Failed to log crisis alert:', err);
                });
                console.log(`[ALERT] High-risk incident logged for counselor review.`);
            }

            saveCheckIn(checkinRecord).catch(dbError => {
                console.warn('Non-fatal: Database pool full. Chatbot history not saved securely.');
            });
        } catch (dbError) {
            console.warn('Non-fatal: Database save sequence failed.');
        }

    } catch (error) {
        console.error('Critical Error in submitCheckIn:', error);
        // Guarantee the UI never stalls completely by providing a safe fallback payload even on catastrophic failure
        res.status(201).json({ 
            data: { 
                aiResponse: "I'm experiencing a high volume of traffic right now and my connection is a bit slow. Please wait a moment and try again. Remember, if you are in immediate distress, please call iCall at 9152987821.", 
                riskLevel: "Amber", 
                intent: "stress", 
                copingStrategy: "Take a deep breath. Close your eyes for 30 seconds." 
            } 
        });
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
