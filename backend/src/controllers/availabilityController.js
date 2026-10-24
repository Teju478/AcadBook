import { Booking } from '../models/Booking.js';
import { Resource } from '../models/Resource.js';
import { bookingConflicts, operatingHoursFor, suggestNearbySlots, validateBookingWindow } from '../utils/bookingRules.js';

export async function getResourceAvailability(req, res, next) {
  try {
    const { resourceId } = req.params;
    const { date, startTime, endTime } = req.query;
    const resource = await Resource.findOne({ _id: resourceId, institutionSlug: req.user.institutionSlug }).lean();
    if (!resource) return res.status(404).json({ ok: false, error: 'Resource not found.' });
    const windowError = validateBookingWindow({ date, startTime, endTime, operatingHours: resource.operatingHours });
    if (windowError) return res.status(400).json({ ok: false, error: windowError });

    const bookingScope = req.query.bookingScope === 'unit' ? 'unit' : 'resource';
    const requestedUnitId = req.query.unitId ? String(req.query.unitId) : null;
    // Pending requests reserve a slot immediately while awaiting review.
    const approved = await Booking.find({ resourceId, date, status: { $in: ['pending', 'approved'] } }).select(`resourceId date bookingScope unitId startTime endTime${req.user.role === 'admin' ? ' requesterName requesterId' : ''}`).lean();
    const candidateResource = { resourceId, date, startTime, endTime, bookingScope: 'resource', unitId: null };
    const resourceConflict = approved.some((booking) => bookingConflicts(candidateResource, booking));
    const units = (resource.units || []).map((unit) => {
      const physicallyAvailable = unit.isAvailable !== false;
      const candidate = { ...candidateResource, bookingScope: 'unit', unitId: unit.unitId };
      return { ...unit, isAvailable: physicallyAvailable && !approved.some((booking) => bookingConflicts(candidate, booking)) };
    });
    const selectedUnit = requestedUnitId ? units.find((unit) => unit.unitId === requestedUnitId) : null;
    const selectedAvailable = Boolean(selectedUnit?.isAvailable);
    const candidate = {
      ...candidateResource,
      bookingScope,
      unitId: bookingScope === 'unit' ? requestedUnitId : null
    };
    const conflicts = approved.filter((booking) => bookingConflicts(candidate, booking));
    const conflict = conflicts[0] ? {
      bookingScope: conflicts[0].bookingScope === 'unit' ? 'unit' : 'resource',
      unitId: conflicts[0].unitId || null,
      date: conflicts[0].date || date,
      startTime: conflicts[0].startTime,
      endTime: conflicts[0].endTime,
      ...(req.user.role === 'admin' && conflicts[0].requesterName ? { bookerName: conflicts[0].requesterName } : {})
    } : null;
    const requestedAvailable = bookingScope === 'resource'
      ? resource.isAvailable !== false && !resourceConflict && ['resource', 'both'].includes(resource.bookingMode)
      : resource.isAvailable !== false && selectedAvailable && ['unit', 'both'].includes(resource.bookingMode);
    const suggestions = requestedAvailable ? [] : suggestNearbySlots({
      resource,
      date,
      startTime,
      endTime,
      bookingScope,
      unitId: bookingScope === 'unit' ? requestedUnitId : null,
      approvedBookings: approved
    });

    res.json({ ok: true, data: {
      resourceId,
      date,
      startTime,
      endTime,
      checkedAt: new Date().toISOString(),
      operatingHours: operatingHoursFor(resource),
      resourceAvailable: resource.isAvailable !== false && !resourceConflict && ['resource', 'both'].includes(resource.bookingMode),
      requestedAvailable,
      conflict,
      selectedUnitAvailable: bookingScope === 'unit' ? selectedAvailable : null,
      unitBookingSupported: ['unit', 'both'].includes(resource.bookingMode),
      units,
      suggestions,
      approvedBookings: approved
    } });
  } catch (error) {
    next(error);
  }
}
