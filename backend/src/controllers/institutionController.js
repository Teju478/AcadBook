import { PREDEFINED_INSTITUTIONS, institutionBySlug } from '../constants/institutions.js';
import { Institution } from '../models/Institution.js';
import { isDatabaseReady } from '../config/database.js';

export async function listInstitutions(req, res, next) {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();
    const source = isDatabaseReady() ? await Institution.find().sort({ name: 1 }).lean() : PREDEFINED_INSTITUTIONS;
    const institutions = source.filter((institution) => {
      if (!query) return true;
      return `${institution.name} ${institution.location}`.toLowerCase().includes(query);
    });
    res.json({ ok: true, data: institutions, source: isDatabaseReady() ? 'mongodb-atlas' : 'predefined-allow-list' });
  } catch (error) {
    next(error);
  }
}

export async function getInstitution(req, res, next) {
  try {
    const institution = isDatabaseReady()
      ? await Institution.findOne({ slug: req.params.slug }).lean()
      : institutionBySlug(req.params.slug);
    if (!institution) return res.status(404).json({ ok: false, error: 'Institution not found' });
    res.json({ ok: true, data: institution });
  } catch (error) {
    next(error);
  }
}
