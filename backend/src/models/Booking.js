import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    institutionSlug: { type: String, required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterName: { type: String, required: true, trim: true },
    requesterRole: { type: String, enum: ['user'], required: true },
    bookingScope: { type: String, enum: ['resource', 'unit'], default: 'resource' },
    unitId: { type: String, default: null, trim: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purpose: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    rejectionReason: { type: String, default: '', trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

bookingSchema.index({ resourceId: 1, date: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ resourceId: 1, date: 1, bookingScope: 1, unitId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
