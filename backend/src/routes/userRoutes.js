import { Router } from 'express';
import { listUsers } from '../controllers/userController.js';
import { requireDatabase } from '../middleware/databaseGuard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const userRouter = Router();
userRouter.use(requireDatabase, requireAuth, requireRole('admin'));
userRouter.get('/', listUsers);
