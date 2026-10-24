import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { PREDEFINED_INSTITUTIONS, institutionBySlug } from '../constants/institutions.js';
import { env } from '../config/env.js';
import { clearSession, publicUser, setSession } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

function normalized(value) {
  return String(value || '').trim();
}

function normalizedInstitution(value) {
  return normalized(value).toLowerCase();
}

function validateCredentials({ name, email, password, institutionSlug }) {
  if (normalized(name).length < 2) return 'Enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(normalized(email))) return 'Enter a valid email address.';
  if (normalized(password).length < 8) return 'Password must be at least 8 characters.';
  if (!institutionBySlug(normalizedInstitution(institutionSlug))) return 'Choose one of the predefined institutions.';
  return null;
}

function matchesInvitationCode(value) {
  if (!env.adminInvitationCode || !value) return false;
  const supplied = Buffer.from(String(value));
  const expected = Buffer.from(env.adminInvitationCode);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export async function register(req, res, next) {
  try {
    const { name, email, password, institutionSlug, role } = req.body;
    if (role !== 'user') return res.status(403).json({ ok: false, error: 'Only User accounts can be created publicly.', code: 'PUBLIC_ROLE_FORBIDDEN' });
    const validationError = validateCredentials({ name, email, password, institutionSlug });
    if (validationError) return res.status(400).json({ ok: false, error: validationError, code: 'VALIDATION_ERROR' });
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name: normalized(name), email: normalized(email).toLowerCase(), passwordHash, institutionSlug: normalizedInstitution(institutionSlug), role: 'user', status: 'active' });
    setSession(res, user);
    return res.status(201).json({ ok: true, data: publicUser(user), message: 'Your User account is ready.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ ok: false, error: 'An account already exists for this email at this institution.', code: 'ACCOUNT_EXISTS' });
    return next(error);
  }
}

export async function registerAdmin(req, res, next) {
  try {
    if (!env.adminInvitationCode) return res.status(503).json({ ok: false, error: 'Admin registration is not configured. Set ADMIN_INVITATION_CODE on the backend.', code: 'ADMIN_REGISTRATION_NOT_CONFIGURED' });
    if (!matchesInvitationCode(req.body.invitationCode)) return res.status(403).json({ ok: false, error: 'The Admin invitation code is invalid.', code: 'ADMIN_INVITATION_INVALID' });
    const { name, email, password, institutionSlug } = req.body;
    const validationError = validateCredentials({ name, email, password, institutionSlug });
    if (validationError) return res.status(400).json({ ok: false, error: validationError, code: 'VALIDATION_ERROR' });
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name: normalized(name), email: normalized(email).toLowerCase(), passwordHash, institutionSlug: normalizedInstitution(institutionSlug), role: 'admin', status: 'active' });
    setSession(res, user);
    return res.status(201).json({ ok: true, data: publicUser(user), message: 'Admin account created and signed in.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ ok: false, error: 'An account already exists for this email at this institution.', code: 'ACCOUNT_EXISTS' });
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, institutionSlug, role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ ok: false, error: 'Choose User or Admin.', code: 'VALIDATION_ERROR' });
    const emailAddress = normalized(email).toLowerCase();
    const institution = normalizedInstitution(institutionSlug);
    if (!institutionBySlug(institution)) return res.status(400).json({ ok: false, error: 'Choose one of the predefined institutions.', code: 'VALIDATION_ERROR' });
    const user = await User.findOne({ email: emailAddress, institutionSlug: institution, role }).select('+passwordHash');
    if (!user) {
      const sameAccount = await User.findOne({ email: emailAddress, institutionSlug: institution }).select('role status');
      if (sameAccount && sameAccount.role !== role) return res.status(403).json({ ok: false, error: `This email is registered as ${sameAccount.role === 'admin' ? 'Admin' : 'User'} for this institution. Open the ${sameAccount.role === 'admin' ? 'Admin' : 'User'} sign-in instead.`, code: 'ROLE_MISMATCH' });
      if (!sameAccount) {
        const accountAtAnotherInstitution = await User.findOne({ email: emailAddress }).select('role institutionSlug status');
        if (accountAtAnotherInstitution) return res.status(403).json({ ok: false, error: 'This email is registered under a different institution. Return to the institution directory and choose the institution used during registration.', code: 'INSTITUTION_MISMATCH' });
      }
      return res.status(401).json({ ok: false, error: 'Email or password did not match this institution.', code: 'INVALID_CREDENTIALS' });
    }
    if (user.status !== 'active' || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
      return res.status(401).json({ ok: false, error: 'Email or password did not match this institution.', code: 'INVALID_CREDENTIALS' });
    }
    user.lastLoginAt = new Date();
    await user.save();
    setSession(res, user);
    return res.json({ ok: true, data: publicUser(user), message: 'Signed in successfully.' });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  clearSession(res);
  return res.json({ ok: true, message: 'Signed out.' });
}

export async function me(req, res) {
  return res.json({ ok: true, data: publicUser(req.user) });
}

export async function bootstrapAdministrator(req, res, next) {
  try {
    if (!env.adminBootstrapToken) return res.status(503).json({ ok: false, error: 'Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_TOKEN on the backend first.', code: 'ADMIN_BOOTSTRAP_DISABLED' });
    const suppliedToken = req.get('x-admin-bootstrap-token') || req.body.bootstrapToken;
    if (!suppliedToken || suppliedToken !== env.adminBootstrapToken) return res.status(403).json({ ok: false, error: 'The Admin bootstrap token is invalid.', code: 'ADMIN_BOOTSTRAP_FORBIDDEN' });
    const { name, email, password, institutionSlug } = req.body;
    const validationError = validateCredentials({ name, email, password, institutionSlug });
    if (validationError) return res.status(400).json({ ok: false, error: validationError, code: 'VALIDATION_ERROR' });
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name: normalized(name), email: normalized(email).toLowerCase(), passwordHash, institutionSlug: normalizedInstitution(institutionSlug), role: 'admin', status: 'active' });
    return res.status(201).json({ ok: true, data: publicUser(user), message: 'Admin created. Remove or rotate ADMIN_BOOTSTRAP_TOKEN after use.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ ok: false, error: 'An account already exists for this email at this institution.', code: 'ACCOUNT_EXISTS' });
    return next(error);
  }
}

export const predefinedInstitutionCount = PREDEFINED_INSTITUTIONS.length;
