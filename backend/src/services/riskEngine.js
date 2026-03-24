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

    // ─── LAYER 2: Build weighted risk score (Lower is worse) ─────────────────
    let score = sentimentScore; // Base is -2 to +2

    // Intent specific modifiers
    const intentWeights = { burnout: -1.5, anxiety: -1.0, stress: -0.5, anger: -1.0, sadness: -1.0 };
    if (intentWeights[primaryIntent]) {
        score += intentWeights[primaryIntent];
    }

    // Medium risk modifiers
    if (mediumRiskKeywords && mediumRiskKeywords.length > 0) {
        score -= 0.5 * mediumRiskKeywords.length;
    }

    // ─── LAYER 3: Historical trend ─────────────────────────────────────────
    let consecutiveNegative = 0;
    
    if (pastSevenDays && pastSevenDays.length > 0) {
        // Find consecutive negative days recently
        for (const c of pastSevenDays) {
            if ((c.sentiment_score ?? 0) < 0) consecutiveNegative++;
            else break;
        }

        if (consecutiveNegative >= 5) score -= 2.0;
        else if (consecutiveNegative >= 3) score -= 1.0;

        // Sudden drop check
        const lastEntry = pastSevenDays[0];
        if (lastEntry && (lastEntry.sentiment_score >= 0.5) && sentimentScore <= -1.5) {
            score -= 1.5; // Shock/Crash
        }
    }

    // ─── LAYER 4: Final thresholding ──────────────────────────────────────────
    let riskLevel = "Green";
    if (score <= -3.0) {
        riskLevel = "Red";
    } else if (score <= -0.5) {
        riskLevel = "Amber";
    }

    console.log('Final risk score:', score.toFixed(2), '→ RISK DECISION:', riskLevel);

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
