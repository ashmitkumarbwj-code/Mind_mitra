import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['RISK_RED', 'INACTIVITY_ESCALATION'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
}, { timestamps: true });

export default mongoose.model('Alert', AlertSchema);
