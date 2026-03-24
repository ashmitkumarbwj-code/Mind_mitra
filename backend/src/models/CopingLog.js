import mongoose from 'mongoose';

const CopingLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    intent: { type: String },
    strategy: { type: String },
}, { timestamps: true });

export default mongoose.model('CopingLog', CopingLogSchema);
