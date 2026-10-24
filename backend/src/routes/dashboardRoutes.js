import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { requireDatabase } from '../middleware/databaseGuard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireDatabase, requireAuth, requireRole('user', 'admin'));
dashboardRouter.get('/summary', getDashboardSummary);
