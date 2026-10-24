import { Router } from 'express';
import { cancelBooking, createBooking, getBooking, listBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { requireDatabase } from '../middleware/databaseGuard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const bookingRouter = Router();
bookingRouter.use(requireDatabase, requireAuth);
bookingRouter.get('/', requireRole('user', 'admin'), listBookings);
bookingRouter.post('/', requireRole('user'), createBooking);
bookingRouter.get('/:bookingId', requireRole('user', 'admin'), getBooking);
bookingRouter.patch('/:bookingId/cancel', requireRole('user'), cancelBooking);
bookingRouter.patch('/:bookingId/status', requireRole('admin'), updateBookingStatus);
