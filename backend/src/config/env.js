import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const asBoolean = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const isManagedPreview = Boolean(process.env.MANUS_WEBDEV_PROJECT_ID);

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.AUTH_SESSION_SECRET || '',
  sessionDuration: process.env.AUTH_SESSION_DURATION || '7d',
  cookieName: 'acadbook_session',
  cookieSecure: asBoolean(process.env.COOKIE_SECURE, isManagedPreview),
  cookieSameSite: process.env.COOKIE_SAMESITE || (isManagedPreview ? 'none' : 'lax'),
  adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN || '',
  adminInvitationCode: process.env.ADMIN_INVITATION_CODE || ''
};
