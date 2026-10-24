import { User } from '../models/User.js';

export async function listUsers(req, res, next) {
  try {
    const filter = { institutionSlug: req.user.institutionSlug };
    if (req.query.role) {
      if (!['user', 'admin'].includes(req.query.role)) return res.status(400).json({ ok: false, error: 'Role must be user or admin.' });
      filter.role = req.query.role;
    }
    const users = await User.find(filter).select('-passwordHash -__v').sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: users });
  } catch (error) {
    next(error);
  }
}
