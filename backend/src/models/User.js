import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Firebase UID
    email: { type: String, default: null },
    isAnonymous: { type: Boolean, default: false },
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
