import { isDatabaseReady } from '../config/database.js';

export function requireDatabase(req, res, next) {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      ok: false,
      error: 'MongoDB Atlas is not connected. Configure MONGODB_URI to load live data.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  return next();
}
