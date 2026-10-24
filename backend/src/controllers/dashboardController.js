import { Booking } from '../models/Booking.js';
import { Resource } from '../models/Resource.js';
import { User } from '../models/User.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const institutionSlug = req.user.institutionSlug;
    const today = new Date().toISOString().slice(0, 10);
    const bookingFilter = { institutionSlug };
    if (req.user.role !== 'admin') bookingFilter.requesterId = req.user._id;
    const [resources, pending, approved, total, users, nextBooking] = await Promise.all([
      Resource.countDocuments({ institutionSlug, isAvailable: true }),
      Booking.countDocuments({ ...bookingFilter, status: 'pending' }),
      Booking.countDocuments({ ...bookingFilter, status: 'approved', date: { $gte: today } }),
      Booking.countDocuments(bookingFilter),
      req.user.role === 'admin' ? User.countDocuments({ institutionSlug, status: 'active' }) : Promise.resolve(null),
      Booking.findOne({ ...bookingFilter, status: 'approved', date: { $gte: today } }).sort({ date: 1, startTime: 1 }).populate('resourceId', 'name category location').lean()
    ]);
    res.json({ ok: true, data: { resources, pending, approved, total, users, nextBooking } });
  } catch (error) {
    next(error);
  }
}
