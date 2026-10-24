import mongoose from 'mongoose';

const resourceUnitSchema = new mongoose.Schema(
  {
    unitId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    kind: { type: String, default: 'workstation', trim: true },
    isAvailable: { type: Boolean, default: true }
  },
  { _id: false }
);

const operatingHoursSchema = new mongoose.Schema(
  {
    startTime: { type: String, default: '08:00' },
    endTime: { type: String, default: '20:00' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    institutionSlug: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['seminar-hall', 'classroom', 'laboratory', 'other'], required: true, trim: true },
    description: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, required: true },
    equipment: { type: [String], default: [] },
    bookingMode: { type: String, enum: ['resource', 'unit', 'both'], default: 'resource' },
    units: { type: [resourceUnitSchema], default: [] },
    operatingHours: { type: operatingHoursSchema, default: () => ({}) },
    isAvailable: { type: Boolean, default: true },
    imageKey: { type: String, default: '' }
  },
  { timestamps: true }
);

resourceSchema.index({ institutionSlug: 1, category: 1, name: 1 });
resourceSchema.path('units').validate((units) => new Set((units || []).map((unit) => unit.unitId)).size === (units || []).length, 'Unit IDs must be unique within a resource.');

export const Resource = mongoose.model('Resource', resourceSchema);
