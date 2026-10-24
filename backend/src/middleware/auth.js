import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.cookieSecure,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/'
};

function tokenFromRequest(req) {
  return req.cookies?.[env.cookieName] || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
}

export async function requireAuth(req, res, next) {
  if (!env.sessionSecret) return res.status(503).json({ ok: false, error: 'Authentication is not configured. Set AUTH_SESSION_SECRET.', code: 'AUTH_NOT_CONFIGURED' });
  const token = tokenFromRequest(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Sign in is required.', code: 'AUTH_REQUIRED' });
  try {
    const claims = jwt.verify(token, env.sessionSecret);
    const user = await User.findById(claims.sub).lean();
    if (!user || user.status !== 'active' || !['user', 'admin'].includes(user.role)) return res.status(401).json({ ok: false, error: 'Your session is no longer active.', code: 'AUTH_INVALID' });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Your session has expired. Please sign in again.', code: 'AUTH_INVALID' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ ok: false, error: 'You do not have permission to access this resource.', code: 'FORBIDDEN' });
    return next();
  };
}

export function sameInstitution(req, institutionSlug) {
  return Boolean(req.user?.institutionSlug && req.user.institutionSlug === institutionSlug);
}

export function setSession(res, user) {
  if (!env.sessionSecret) throw Object.assign(new Error('AUTH_SESSION_SECRET is not configured.'), { code: 'AUTH_NOT_CONFIGURED' });
  const token = jwt.sign({ sub: String(user._id), role: user.role, institutionSlug: user.institutionSlug }, env.sessionSecret, { expiresIn: env.sessionDuration });
  res.cookie(env.cookieName, token, sessionCookieOptions);
}

export function clearSession(res) {
  res.clearCookie(env.cookieName, sessionCookieOptions);
}

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, institutionSlug: user.institutionSlug, status: user.status };
}
