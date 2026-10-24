export const RESOURCE_CATEGORIES = ['seminar-hall', 'classroom', 'laboratory', 'other'];
export const BOOKING_SCOPES = ['resource', 'unit'];
export const DEFAULT_OPERATING_HOURS = { startTime: '08:00', endTime: '20:00', timezone: 'Asia/Kolkata' };

export function normalizeCategory(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  return RESOURCE_CATEGORIES.includes(normalized) ? normalized : null;
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

export function validTime(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export function minutesFromTime(value) {
  if (!validTime(value)) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function effectiveBookingScope(value) {
  return value === 'unit' ? 'unit' : 'resource';
}

export function bookingConflicts(candidate, existing) {
  // Availability and booking queries are already scoped to one resource. If a
  // projection omits resourceId, do not discard an otherwise valid conflict;
  // still reject records that explicitly belong to another resource.
  if (candidate.resourceId && existing.resourceId && candidate.resourceId.toString() !== existing.resourceId.toString()) return false;
  if (candidate.date !== existing.date) return false;
  if (!overlaps(candidate.startTime, candidate.endTime, existing.startTime, existing.endTime)) return false;
  const candidateScope = effectiveBookingScope(candidate.bookingScope);
  const existingScope = effectiveBookingScope(existing.bookingScope);
  if (candidateScope === 'resource' || existingScope === 'resource') return true;
  return String(candidate.unitId || '') === String(existing.unitId || '');
}

export function operatingHoursFor(resource) {
  const hours = resource?.operatingHours || {};
  const startTime = validTime(hours.startTime) ? hours.startTime : DEFAULT_OPERATING_HOURS.startTime;
  const endTime = validTime(hours.endTime) ? hours.endTime : DEFAULT_OPERATING_HOURS.endTime;
  return { startTime, endTime, timezone: hours.timezone || DEFAULT_OPERATING_HOURS.timezone };
}

export function validateBookingWindow({ date, startTime, endTime, operatingHours }) {
  if (!validDate(date)) return 'Choose a valid booking date.';
  if (!validTime(startTime) || !validTime(endTime)) return 'Choose valid start and end times.';
  if (startTime >= endTime) return 'End time must be later than start time.';
  if (operatingHours) {
    const hours = operatingHoursFor({ operatingHours });
    if (startTime < hours.startTime || endTime > hours.endTime) return `Choose a time between ${hours.startTime} and ${hours.endTime}.`;
  }
  return null;
}

export function bookingDurationMinutes(startTime, endTime) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  return start === null || end === null || end <= start ? null : end - start;
}

export function suggestNearbySlots({ resource, date, startTime, endTime, bookingScope = 'resource', unitId = null, approvedBookings = [], limit = 5 }) {
  const duration = bookingDurationMinutes(startTime, endTime);
  if (!duration) return [];
  const requestedStart = minutesFromTime(startTime);
  const hours = operatingHoursFor(resource);
  const opening = minutesFromTime(hours.startTime);
  const closing = minutesFromTime(hours.endTime);
  const candidates = [];
  for (let offset = 30; offset <= 240 && candidates.length < limit * 3; offset += 30) {
    for (const candidateStart of [requestedStart - offset, requestedStart + offset]) {
      const candidateEnd = candidateStart + duration;
      if (candidateStart < opening || candidateEnd > closing) continue;
      const candidate = { resourceId: resource._id, date, startTime: timeFromMinutes(candidateStart), endTime: timeFromMinutes(candidateEnd), bookingScope, unitId: bookingScope === 'unit' ? unitId : null };
      if (!approvedBookings.some((booking) => bookingConflicts(candidate, booking))) {
        candidates.push({ ...candidate, label: `${candidate.startTime}–${candidate.endTime}` });
      }
      if (candidates.length >= limit) break;
    }
  }
  return candidates;
}
