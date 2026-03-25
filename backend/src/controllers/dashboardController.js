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

        // ─── Parallel Queries ─────────────────────────────────
        console.log(`[DASHBOARD] Parallel fetch start for UID: ${uid}`);
        const [allRecentCheckIns, last30Entries, alerts, user] = await Promise.all([
            CheckIn.find({ userId: uid, createdAt: { $gte: sevenDaysAgo } })
                .sort({ createdAt: -1 })
                .select('rawMessage sentimentScore riskLevel intent createdAt')
                .lean(),
            CheckIn.find({ userId: uid })
                .sort({ createdAt: -1 })
                .limit(30)
                .select('riskLevel createdAt')
                .lean(),
            Alert.find({ userId: uid, status: 'OPEN' }).sort({ createdAt: -1 }).limit(5).lean(),
            User.findById(uid).lean()
        ]);
        console.log(`[DASHBOARD] Parallel fetch COMPLETE. last30: ${last30Entries.length}`);

        // ─── Mood Trend: Build 7-day grid ─────────────────────
        const moodTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgo(i);
            const next = daysAgo(i - 1);
            const dayCheckins = allRecentCheckIns.filter(c => {
                const t = new Date(c.createdAt);
                return t >= d && t < next;
            });
            const score = dayCheckins.length > 0
                ? parseFloat((dayCheckins.reduce((s, c) => s + (c.sentimentScore || 0), 0) / dayCheckins.length).toFixed(2))
                : null;
            moodTrend.push({
                date: d.toISOString().split('T')[0],
                score,
                count: dayCheckins.length
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

        // ─── 6. Pattern Detection (Advanced) ──────────────────
        // Check for persistent low mood in last 5 check-ins
        const last5 = last30Entries.slice(0, 5);
        const lowMoodCount = last5.filter(c => c.riskLevel === 'Red' || c.riskLevel === 'Amber').length;
        const negativeDays = moodTrend.filter(d => d.score !== null && d.score < -0.5).length;
        
        let patternAlert = null;
        if (lowMoodCount >= 4) {
             patternAlert = { 
                 level: 'RED', 
                 title: 'Persistent Low Mood Detected',
                 message: "We've noticed you've been feeling down for several days recently. It might be very helpful to speak with a professional counselor to get support during this time."
             };
        } else if (negativeDays >= 5) {
            patternAlert = { level: 'RED', title: 'Difficult Week Detected', message: `You've had ${negativeDays} difficult days this week. You're not alone — talking to someone can help.` };
        } else if (negativeDays >= 3) {
            patternAlert = { level: 'AMBER', title: 'Challenging Trend', message: `We've noticed ${negativeDays} challenging days recently. Remember to be kind to yourself.` };
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
                riskTrend: (last30Entries || []).map(c => {
                    const level = c.riskLevel === 'Green' ? 2 : (c.riskLevel === 'Amber' ? 1 : 0);
                    return {
                        date: c.createdAt,
                        level,
                        risk: c.riskLevel || 'Unknown'
                    };
                }).reverse(),
                alerts,
                user
            }
        });

    } catch (error) {
        console.error('[DASHBOARD] Error:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard data.' });
    }
};
