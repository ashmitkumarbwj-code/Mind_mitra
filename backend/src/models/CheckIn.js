import mongoose from 'mongoose';

const CheckInSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    rawMessage: { type: String, required: true },
    journalWentWell: { type: String, default: null },
    journalDrained: { type: String, default: null },
    sentimentScore: { type: Number, default: 0 },
    intent: { type: String, default: 'general' },
    riskLevel: { type: String, enum: ['Green', 'Amber', 'Red'], default: 'Green' },
    aiResponse: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('CheckIn', CheckInSchema);
