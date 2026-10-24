import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';

if (!env.mongoUri) throw new Error('MONGODB_URI is required to migrate existing roles.');
await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
const userResult = await User.collection.updateMany({ role: { $in: ['student', 'faculty'] } }, { $set: { role: 'user' } });
const adminResult = await User.collection.updateMany({ role: 'administrator' }, { $set: { role: 'admin' } });
const bookingResult = await Booking.collection.updateMany({ requesterRole: { $in: ['student', 'faculty'] } }, { $set: { requesterRole: 'user' } });
console.log(JSON.stringify({ usersToUser: userResult.modifiedCount, adminsToAdmin: adminResult.modifiedCount, bookingsToUser: bookingResult.modifiedCount }));
await mongoose.disconnect();
