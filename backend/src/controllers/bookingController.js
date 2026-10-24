import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { BookingApprovalLock } from '../models/BookingApprovalLock.js';
import { Resource } from '../models/Resource.js';
import { bookingConflicts, suggestNearbySlots, validateBookingWindow } from '../utils/bookingRules.js';

function apiError(message, statusCode, code, details = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  Object.assign(error, details);
  return error;
}

function conflictDetails(booking) {
  if (!booking) return null;
  return {
    bookingScope: booking.bookingScope === 'unit' ? 'unit' : 'resource',
    unitId: booking.unitId || null,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime
  };
}

async function approvedConflicts(candidate, session) {
  const approved = await Booking.find({
    resourceId: candidate.resourceId,
    date: candidate.date,
    status: 'approved',
    _id: { $ne: candidate._id }
  }).session(session).lean();
  return approved.filter((booking) => bookingConflicts(candidate, booking));
}

async function acquireBookingLock(resourceId, date) {
  const lockId = `${resourceId.toString()}:${date}`;
  const owner = new mongoose.Types.ObjectId().toString();
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + 15000);
    const lock = await BookingApprovalLock.findOneAndUpdate(
      { _id: lockId, $or: [{ lockedBy: null }, { lockedUntil: null }, { lockedUntil: { $lte: now } }, { lockedBy: owner }] },
      { $set: { resourceId, date, lockedBy: owner, lockedUntil, touchedAt: now } },
      { new: true }
    ).lean();
    if (lock?.lockedBy === owner) return { lockId, owner };
    try {
      await BookingApprovalLock.create({ _id: lockId, resourceId, date, lockedBy: owner, lockedUntil, touchedAt: now });
      return { lockId, owner };
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw apiError('The booking service is busy. Please try again.', 503, 'BOOKING_LOCK_TIMEOUT');
}

async function releaseBookingLock(lock) {
  if (!lock) return;
  await BookingApprovalLock.updateOne(
    { _id: lock.lockId, lockedBy: lock.owner },
    { $set: { lockedBy: null, lockedUntil: null, touchedAt: new Date() } }
  );
}

async function approveWithLock(bookingId, adminId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let updated;
      await session.withTransaction(async () => {
        const booking = await Booking.findOne({ _id: bookingId, status: 'pending' }).session(session);
        if (!booking) throw apiError('Only pending booking requests can be approved.', 409, 'BOOKING_NOT_PENDING');
        const resource = await Resource.findOne({ _id: booking.resourceId, institutionSlug: booking.institutionSlug }).session(session).lean();
        if (!resource) throw apiError('The requested resource no longer exists.', 409, 'RESOURCE_NOT_FOUND');
        if (resource.isAvailable === false) throw apiError('This resource is currently unavailable.', 409, 'RESOURCE_UNAVAILABLE');
        const windowError = validateBookingWindow({ ...booking, operatingHours: resource.operatingHours });
        if (windowError) throw apiError(windowError, 409, 'BOOKING_OUTSIDE_HOURS');
        if (booking.bookingScope === 'resource' && !['resource', 'both'].includes(resource.bookingMode)) throw apiError('This resource only supports individual unit bookings.', 409, 'BOOKING_SCOPE_UNSUPPORTED');
        if (booking.bookingScope === 'unit') {
          const unit = (resource.units || []).find((item) => item.unitId === booking.unitId);
          if (!unit || unit.isAvailable === false) throw apiError('The selected unit is no longer available.', 409, 'UNIT_UNAVAILABLE');
        }
        const lockId = `${booking.resourceId.toString()}:${booking.date}`;
        await BookingApprovalLock.findOneAndUpdate(
          { _id: lockId },
          { $set: { resourceId: booking.resourceId, date: booking.date, touchedAt: new Date() } },
          { upsert: true, new: true, session }
        );
        const conflicts = await approvedConflicts(booking, session);
        if (conflicts.length) throw apiError('This request conflicts with an approved booking. Recheck availability before approving.', 409, 'APPROVAL_CONFLICT');
        updated = await Booking.findOneAndUpdate(
          { _id: bookingId, status: 'pending' },
          { $set: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date(), approvedAt: new Date(), rejectionReason: '' } },
          { new: true, session }
        ).populate('resourceId', 'name category location').lean();
      });
      return updated;
    } catch (error) {
      const retryable = error?.hasErrorLabel?.('TransientTransactionError') || error?.hasErrorLabel?.('UnknownTransactionCommitResult') || error?.code === 112 || error?.code === 11000;
      if (!retryable || attempt === 3) throw error;
    } finally {
      await session.endSession();
    }
  }
}

export async function listBookings(req, res, next) {
  try {
    const filter = { institutionSlug: req.user.institutionSlug };
    if (req.user.role !== 'admin') filter.requesterId = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    const bookings = await Booking.find(filter).populate('resourceId', 'name category location bookingMode units').sort({ date: 1, startTime: 1, createdAt: -1 }).lean();
    res.json({ ok: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function createBooking(req, res, next) {
  try {
    if (req.user.role !== 'user') return res.status(403).json({ ok: false, error: 'Only User accounts can request bookings.' });
    const resource = await Resource.findOne({ _id: req.body.resourceId, institutionSlug: req.user.institutionSlug }).lean();
    if (!resource) return res.status(404).json({ ok: false, error: 'Resource not found in your institution.' });
    const windowError = validateBookingWindow({ ...req.body, operatingHours: resource.operatingHours });
    if (windowError) return res.status(400).json({ ok: false, error: windowError, code: 'BOOKING_OUTSIDE_HOURS' });
    if (resource.isAvailable === false) return res.status(409).json({ ok: false, error: 'This resource is currently unavailable.' });
    const bookingScope = req.body.bookingScope || 'resource';
    if (!['resource', 'unit'].includes(bookingScope)) return res.status(400).json({ ok: false, error: 'Choose a valid booking scope.' });
    if (bookingScope === 'resource' && !['resource', 'both'].includes(resource.bookingMode)) return res.status(409).json({ ok: false, error: 'This resource supports individual unit bookings only.' });
    let unitId = null;
    if (bookingScope === 'unit') {
      if (!['unit', 'both'].includes(resource.bookingMode)) return res.status(409).json({ ok: false, error: 'Individual unit booking is not supported for this resource.' });
      const unit = (resource.units || []).find((item) => item.unitId === String(req.body.unitId));
      if (!unit || unit.isAvailable === false) return res.status(409).json({ ok: false, error: 'Choose an available unit.' });
      unitId = unit.unitId;
    }
    if (!String(req.body.purpose || '').trim()) return res.status(400).json({ ok: false, error: 'Purpose is required.' });
    const candidate = { resourceId: resource._id, date: req.body.date, startTime: req.body.startTime, endTime: req.body.endTime, bookingScope, unitId };
    let booking;
    const lock = await acquireBookingLock(resource._id, req.body.date);
    try {
      const lockedResource = await Resource.findOne({ _id: resource._id, institutionSlug: req.user.institutionSlug }).lean();
      if (!lockedResource) throw apiError('Resource not found in your institution.', 404, 'RESOURCE_NOT_FOUND');
      if (lockedResource.isAvailable === false) throw apiError('This resource is currently unavailable.', 409, 'RESOURCE_UNAVAILABLE');
      const activeBookings = await Booking.find({
        resourceId: lockedResource._id,
        date: req.body.date,
        status: { $in: ['pending', 'approved'] }
      }).select('resourceId date bookingScope unitId startTime endTime').lean();
      const conflict = activeBookings.find((existing) => bookingConflicts(candidate, existing));
      if (conflict) {
        const suggestions = suggestNearbySlots({ resource: lockedResource, date: req.body.date, startTime: req.body.startTime, endTime: req.body.endTime, bookingScope, unitId, approvedBookings: activeBookings });
        throw apiError('Oops! The slot is already booked. Choose another slot.', 409, 'BOOKING_CONFLICT', { conflict: conflictDetails(conflict), suggestions });
      }
      booking = await Booking.create({
        institutionSlug: req.user.institutionSlug,
        resourceId: lockedResource._id,
        requesterId: req.user._id,
        requesterName: req.user.name,
        requesterRole: req.user.role,
        bookingScope,
        unitId,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        purpose: String(req.body.purpose).trim(),
        status: 'pending'
      });
    } finally {
      await releaseBookingLock(lock);
    }
    res.status(201).json({ ok: true, data: booking, message: 'Booking request submitted and is pending Admin review.' });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req, res, next) {
  try {
    const filter = { _id: req.params.bookingId, institutionSlug: req.user.institutionSlug };
    if (req.user.role !== 'admin') filter.requesterId = req.user._id;
    const booking = await Booking.findOne(filter).populate('resourceId').lean();
    if (!booking) return res.status(404).json({ ok: false, error: 'Booking request not found' });
    res.json({ ok: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { status, rejectionReason = '' } = req.body;
    if (status === 'approved') {
      const booking = await approveWithLock(req.params.bookingId, req.user._id);
      return res.json({ ok: true, data: booking, message: 'Booking approved.' });
    }
    if (!['rejected', 'cancelled'].includes(status)) return res.status(400).json({ ok: false, error: 'Administrators can approve, reject, or cancel booking requests.' });
    if (status === 'rejected' && !String(rejectionReason).trim()) return res.status(400).json({ ok: false, error: 'A rejection reason is required.' });
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, institutionSlug: req.user.institutionSlug, status: 'pending' },
      { $set: { status, rejectionReason: status === 'rejected' ? String(rejectionReason).trim() : '', reviewedBy: req.user._id, reviewedAt: new Date(), cancelledAt: status === 'cancelled' ? new Date() : null } },
      { new: true, runValidators: true }
    ).populate('resourceId', 'name category location').lean();
    if (!booking) return res.status(409).json({ ok: false, error: 'Only pending booking requests can be changed this way.', code: 'BOOKING_NOT_PENDING' });
    res.json({ ok: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, institutionSlug: req.user.institutionSlug, requesterId: req.user._id, status: { $in: ['pending', 'approved'] } },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true, runValidators: true }
    ).populate('resourceId', 'name category location').lean();
    if (!booking) return res.status(409).json({ ok: false, error: 'Only your pending or approved bookings can be cancelled.' });
    res.json({ ok: true, data: booking, message: 'Booking cancelled.' });
  } catch (error) {
    next(error);
  }
}
