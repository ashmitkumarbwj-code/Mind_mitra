// Negative intents that increase risk level
const HIGH_RISK_INTENTS = new Set(['sadness', 'burnout', 'anger']);
const MEDIUM_RISK_INTENTS = new Set(['stress', 'anxiety', 'loneliness']);

export const evaluateRisk = (currentCheckin, pastSevenDays) => {
    const { sentimentScore, riskKeywords, mediumRiskKeywords, primaryIntent } = currentCheckin;

    console.log('--- RISK ENGINE ---');
    console.log('Input sentimentScore:', sentimentScore, 'intent:', primaryIntent);
    console.log('High-risk keywords:', riskKeywords);
    console.log('Medium-risk keywords:', mediumRiskKeywords);

    // ─── LAYER 1: Immediate High-Risk overrides ───────────────────────────────
    if (riskKeywords && riskKeywords.length > 0) {
        console.log('RISK DECISION: RED (high-risk keyword detected)');
        return "Red";
    }

    if (sentimentScore <= -2) {
        console.log('RISK DECISION: RED (very negative sentiment)');
        return "Red";
    }

    // ─── LAYER 2: Build weighted risk score ─────────────────────────────────
    let score = 0;

    // Sentiment weight (normalised: -2 to +2 → contribution to score)
    score += sentimentScore; // e.g. -1 adds -1 to score

    // Keyword weight
    if (mediumRiskKeywords && mediumRiskKeywords.length > 0) {
        score -= 1; // each medium keyword block adds -1 penalty
    }

    // Intent weight
    if (HIGH_RISK_INTENTS.has(primaryIntent)) {
        score -= 1;
    } else if (MEDIUM_RISK_INTENTS.has(primaryIntent)) {
        score -= 0.5;
    }

    // ─── LAYER 3: Historical trend ─────────────────────────────────────────
    let trendScore = 0;
    if (pastSevenDays && pastSevenDays.length > 0) {
        let consecutiveNegative = 0;
        let maxConsecutive = 0;
        
        // Count consecutive negative days (oldest to newest)
        const sorted = [...pastSevenDays].reverse();
        for (const c of sorted) {
            const s = c.sentiment_score ?? 0;
            if (s < 0) {
                consecutiveNegative++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveNegative);
            } else {
                consecutiveNegative = 0;
            }
        }

        if (maxConsecutive >= 5) {
            trendScore = -2; // RED escalation
        } else if (maxConsecutive >= 3) {
            trendScore = -1; // AMBER escalation
        }

        // Sudden drop: check if last recorded score was positive but current is very negative
        const lastEntry = pastSevenDays[0];
        if (lastEntry && (lastEntry.sentiment_score >= 1) && sentimentScore <= -2) {
            trendScore = Math.min(trendScore, -2); // force RED on sudden crash
        }

        score += trendScore;
        console.log('Trend score:', trendScore, '| Max consecutive negative days:', maxConsecutive);
    }

    // ─── LAYER 4: Final mapping ───────────────────────────────────────────
    let riskLevel;
    if (score <= -2) {
        riskLevel = "Red";
    } else if (score < 0) {
        riskLevel = "Amber";
    } else {
        riskLevel = "Green";
    }

    console.log('Final weighted score:', score.toFixed(2), '→ RISK DECISION:', riskLevel);
    console.log('-------------------');

    return riskLevel;
};

// Maps intent to a short coping strategy
export const getCopingStrategy = (intent) => {
    const map = {
        'anxiety':   '4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 3 times.',
        'stress':    'Try a 5-minute walk outside or stretch at your desk.',
        'loneliness':'Send a quick message to one person you haven\'t spoken to in a while.',
        'sadness':   'Write down 3 small things around you right now that you can be grateful for.',
        'burnout':   'Close your work for 15 minutes. Make tea. Sit quietly. No phone.',
        'anger':     'Splash cold water on your face and take 5 slow, deep breaths.',
        'happiness': 'Keep it up! Maybe share what\'s going well with someone you care about.',
        'calm':      'A great day to practice a short mindfulness session!',
    };
    return map[intent] || 'Take a short break, hydrate, and be kind to yourself today.';
};
