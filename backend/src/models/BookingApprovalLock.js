import mongoose from 'mongoose';

const approvalLockSchema = new mongoose.Schema(
  {
    _id: { type: String },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    date: { type: String, required: true },
    lockedBy: { type: String, default: null },
    lockedUntil: { type: Date, default: null },
    touchedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const BookingApprovalLock = mongoose.model('BookingApprovalLock', approvalLockSchema);
