import CheckIn from '../models/CheckIn.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';

// Helper: ISO date string for N days ago
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const getUserDashboard = async (req, res) => {
    try {
        const { user_id, userId } = req.query;
        const uid = user_id || userId || 'anonymous';
        const sevenDaysAgo = daysAgo(7);

        // ─── 1. MongoDB Aggregation Pipeline ──────────────────
        const [moodAggregation, allRecentCheckIns, alerts, user] = await Promise.all([

            // Mood Trend: daily average sentiment for last 7 days
            CheckIn.aggregate([
                { $match: { userId: uid, createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        avgSentiment: { $avg: '$sentimentScore' },
                        count: { $sum: 1 },
                        topRisk: { $last: '$riskLevel' },
                        emotions: { $push: '$intent' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),

            // All recent check-ins for other calculations
            CheckIn.find({ userId: uid, createdAt: { $gte: sevenDaysAgo } })
                .sort({ createdAt: -1 })
                .select('rawMessage sentimentScore riskLevel intent createdAt')
                .lean(),

            // Active alerts
            Alert.find({ userId: uid, status: 'OPEN' }).sort({ createdAt: -1 }).limit(5).lean(),

            // User profile
            User.findById(uid).lean()
        ]);

        // ─── 2. Mood Trend (Fill all 7 days even if no data) ──
        const moodTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgo(i);
            const key = d.toISOString().split('T')[0];
            const found = moodAggregation.find(a => a._id === key);
            moodTrend.push({
                date: key,
                score: found ? parseFloat(found.avgSentiment.toFixed(2)) : null,
                count: found ? found.count : 0,
            });
        }

        // ─── 3. Current Risk Status ────────────────────────────
        const latest = allRecentCheckIns[0];
        const currentRisk = latest?.riskLevel || 'Green';

        // ─── 4. Emotion Distribution ──────────────────────────
        const emotionMap = {};
        allRecentCheckIns.forEach(c => {
            const e = c.intent || 'general';
            emotionMap[e] = (emotionMap[e] || 0) + 1;
        });
        const emotionStats = Object.entries(emotionMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // ─── 5. Streak Calculation ─────────────────────────────
        const activeDays = new Set(allRecentCheckIns.map(c =>
            new Date(c.createdAt).toISOString().split('T')[0]
        ));
        let streak = 0;
        for (let i = 0; i < 7; i++) {
            const key = daysAgo(i).toISOString().split('T')[0];
            if (activeDays.has(key)) streak++;
            else break;
        }

        // ─── 6. Pattern Detection ──────────────────────────────
        const negativeDays = moodTrend.filter(d => d.score !== null && d.score < -0.5).length;
        let patternAlert = null;
        if (negativeDays >= 5) {
            patternAlert = { level: 'RED', message: `You've had ${negativeDays} difficult days this week. You're not alone — talking to someone can help.` };
        } else if (negativeDays >= 3) {
            patternAlert = { level: 'AMBER', message: `We've noticed ${negativeDays} challenging days recently. Remember to be kind to yourself.` };
        }

        // ─── 7. Recent Entries ─────────────────────────────────
        const recentEntries = allRecentCheckIns.slice(0, 5).map(c => ({
            message: c.rawMessage,
            sentiment: c.sentimentScore,
            riskLevel: c.riskLevel,
            intent: c.intent,
            date: c.createdAt
        }));

        // ─── 8. Aggregate Stats ────────────────────────────────
        const checkinCount = allRecentCheckIns.length;
        const avgSentiment = checkinCount > 0
            ? parseFloat((allRecentCheckIns.reduce((s, c) => s + (c.sentimentScore || 0), 0) / checkinCount).toFixed(2))
            : 0;
        const topIntent = emotionStats[0]?.name || 'Calm';
        const amberCount = allRecentCheckIns.filter(c => c.riskLevel === 'Amber').length;
        const burnoutScore = Math.min(100, Math.round((amberCount / Math.max(checkinCount, 1)) * 100));

        res.status(200).json({
            data: {
                moodTrend,
                currentRisk,
                currentRiskStatus: currentRisk,
                emotionStats,
                checkinCount,
                streak,
                patternAlert,
                recentEntries,
                avgSentiment,
                topIntent,
                burnoutScore,
                activitiesCompleted: checkinCount,
                trends: moodTrend.map(d => ({ date: d.date, score: d.score })),
                alerts,
                user
            }
        });

    } catch (error) {
        console.error('[DASHBOARD] Error:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard data.' });
    }
};
