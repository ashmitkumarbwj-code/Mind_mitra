const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const connectDB = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/checkin', async (req, res) => {
  try {
    const { userId, feeling } = req.body;
    
    if (!userId || !feeling) {
      return res.status(400).json({ error: 'Missing userId or feeling text' });
    }

    const db = await connectDB();
    const checkinsCollection = db.collection('checkins');

    // Fetch previous checkins for this user to identify high-risk patterns
    const historyCursor = await checkinsCollection.find({ userId }).sort({ timestamp: -1 }).limit(10);
    const history = await historyCursor.toArray();
    
    const historyText = history.map(h => `[${new Date(h.timestamp).toISOString()}] User felt: ${h.feeling} (Sentiment: ${h.analysis?.sentiment || 'unknown'})`).join('\n');

    const systemPrompt = `You are Mind Mitra, a compassionate and empathetic mental health AI assistant. 
The user is talking to you about how they feel. 
Your goal is to listen, validate their feelings, and provide support.

Analyze the user's current input:
Current Feeling: "${feeling}"

Recent History (for context):
${historyText || "This is your first conversation today."}

Tasks:
1. Categorize their current sentiment: "green" (positive/stable), "amber" (struggling/stressed), or "red" (crisis/severe distress).
2. Suggest 2-3 simple, actionable coping strategies or breathing exercises.
3. If you detect high-risk patterns (e.g., persistent "red" sentiment, mention of self-harm, or severe hopelessness), you MUST provide a gentle but firm recommendation to contact a professional counselor or helpline.

Respond ONLY in the following JSON format:
{
  "sentiment": "green" | "amber" | "red",
  "copingStrategies": ["short, helpful strategy 1", "short, helpful strategy 2"],
  "highRiskDetected": true | false,
  "counselorMessage": "Empathetic message if high risk detected, else null"
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
    });
    
    let analysis;
    try {
        let textResponse = response.text;
        textResponse = textResponse.replace(/^```json/g, '').replace(/```$/g, '').trim();
        analysis = JSON.parse(textResponse);
    } catch (parseError) {
        console.error("Failed to parse Gemini response:", response.text);
        analysis = {
            sentiment: "amber",
            copingStrategies: ["Take a few deep breaths", "Take a walk outside"],
            highRiskDetected: false,
            counselorMessage: null
        };
    }

    const newCheckin = {
        userId,
        feeling,
        timestamp: new Date(),
        analysis
    };
    
    await checkinsCollection.insertOne(newCheckin);

    res.status(200).json(newCheckin);
  } catch (error) {
    console.error("Error in /api/checkin:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = await connectDB();
    const checkinsCollection = db.collection('checkins');

    // Fetch up to the last 30 checkins for charting
    const historyCursor = await checkinsCollection.find({ userId }).sort({ timestamp: -1 }).limit(30);
    const history = await historyCursor.toArray();

    // Reverse logic to get chronological order for the chart (oldest to newest)
    history.reverse();
    
    res.status(200).json(history);
  } catch (error) {
    console.error("Error in /api/history:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
