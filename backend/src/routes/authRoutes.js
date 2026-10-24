import { Router } from 'express';
import { bootstrapAdministrator, login, logout, me, register, registerAdmin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDatabase } from '../middleware/databaseGuard.js';

export const authRouter = Router();
authRouter.post('/register', requireDatabase, register);
authRouter.post('/register/admin', requireDatabase, registerAdmin);
authRouter.post('/login', requireDatabase, login);
authRouter.post('/logout', logout);
authRouter.get('/me', requireDatabase, requireAuth, me);
authRouter.post('/admin/bootstrap', requireDatabase, bootstrapAdministrator);
