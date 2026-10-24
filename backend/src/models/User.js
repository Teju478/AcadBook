import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    institutionSlug: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], required: true, index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ email: 1, institutionSlug: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
