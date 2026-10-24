import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    location: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, uppercase: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

export const Institution = mongoose.model('Institution', institutionSchema);
