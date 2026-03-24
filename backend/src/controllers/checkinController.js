import { analyzeCheckInText, generateResponse } from '../services/aiService.js';
import { evaluateRisk, getCopingStrategy } from '../services/riskEngine.js';
import { saveCheckIn, getRecentCheckIns } from '../services/dbService.js';

export const submitCheckIn = async (req, res) => {
    try {
        const { userId, text, microJournaling } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Check-in text is required' });
        }

        // 1. AI Analysis Layer
        const aiAnalysis = await analyzeCheckInText(text);
        
        // 2. Fetch recent history for Risk Engine
        const recentHistory = await getRecentCheckIns(userId || 'anonymous');

        // 3. Risk Engine Evaluation
        const currentData = {
            sentimentScore: aiAnalysis.sentimentScore,
            riskKeywords: aiAnalysis.riskKeywords,
            mediumRiskKeywords: aiAnalysis.mediumRiskKeywords,
            primaryIntent: aiAnalysis.primaryIntent
        };
        const riskLevel = evaluateRisk(currentData, recentHistory);

        // 4. Coping Strategy Mapping
        const copingStrategy = getCopingStrategy(aiAnalysis.primaryIntent);

        // 5. Response Generator
        const aiResponseText = await generateResponse(aiAnalysis.primaryIntent, riskLevel, copingStrategy, null);

        // 6. DB Storage
        const checkinRecord = {
            user_id: userId || null,
            raw_message: text,
            journal_went_well: microJournaling?.wentWell || null,
            journal_drained: microJournaling?.drained || null,
            sentiment_score: aiAnalysis.sentimentScore,
            intent: aiAnalysis.primaryIntent,
            keywords: JSON.stringify(aiAnalysis.riskKeywords),
            risk_level: riskLevel,
            ai_response: aiResponseText
        };

        const savedRecord = await saveCheckIn(checkinRecord);

        // 7. Return to Client
        res.status(201).json({
            message: 'Check-in processed successfully',
            data: {
                aiResponse: aiResponseText,
                riskLevel: riskLevel,
                intent: aiAnalysis.primaryIntent,
                copingStrategy
            }
        });

    } catch (error) {
        console.error('Error in submitCheckIn:', error);
        res.status(500).json({ error: 'Failed to process check-in.' });
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
