import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase, getDatabaseStatus } from './config/database.js';
import { env } from './config/env.js';
import { seedPredefinedInstitutions } from './seed/institutions.js';
import { seedDemoResources } from './seed/resources.js';
import { institutionRouter } from './routes/institutionRoutes.js';
import { resourceRouter } from './routes/resourceRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

app.use(cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'acadbook-api',
    database: getDatabaseStatus(),
    authentication: env.sessionSecret ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRouter);
app.use('/api/institutions', institutionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/users', userRouter);

const frontendDist = path.join(projectRoot, 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`[server] AcadBook API listening on http://0.0.0.0:${env.port}`);
});

try {
  const databaseConnected = await connectDatabase();
  if (databaseConnected) {
    await seedPredefinedInstitutions();
    await seedDemoResources();
  }
} catch (error) {
  console.error('[startup] Database seed failed after the API started:', error.message);
}
