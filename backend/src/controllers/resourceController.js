import { Resource } from '../models/Resource.js';
import { institutionBySlug } from '../constants/institutions.js';
import { normalizeCategory, RESOURCE_CATEGORIES } from '../utils/bookingRules.js';

function scopedInstitution(req) {
  return req.user.institutionSlug;
}

function normalizeUnits(units = []) {
  return units.filter((unit) => unit?.unitId && unit?.label).map((unit) => ({
    unitId: String(unit.unitId).trim(),
    label: String(unit.label).trim(),
    kind: String(unit.kind || 'workstation').trim(),
    isAvailable: unit.isAvailable !== false
  }));
}

function resourcePayload(body, institutionSlug) {
  const { _id, createdAt, updatedAt, __v, ...editableBody } = body;
  const category = normalizeCategory(body.category);
  if (!category) return { error: `Category must be one of: ${RESOURCE_CATEGORIES.join(', ')}.` };
  const bookingMode = ['resource', 'unit', 'both'].includes(body.bookingMode) ? body.bookingMode : 'resource';
  const units = normalizeUnits(body.units);
  if (bookingMode !== 'resource' && units.length === 0) return { error: 'Add at least one available unit when unit booking is enabled.' };
  if (bookingMode === 'resource' && units.length > 0) return { error: 'Choose unit or both booking mode when adding units.' };
  return {
    value: {
      ...editableBody,
      institutionSlug,
      category,
      bookingMode,
      units,
      capacity: Number(body.capacity),
      equipment: Array.isArray(body.equipment) ? body.equipment : []
    }
  };
}

export async function listResources(req, res, next) {
  try {
    const filter = { institutionSlug: scopedInstitution(req) };
    if (req.query.category) {
      const category = normalizeCategory(req.query.category);
      if (!category) return res.status(400).json({ ok: false, error: 'Unknown resource category.' });
      filter.category = category;
    }
    if (req.query.bookingMode) {
      if (!['resource', 'unit', 'both'].includes(req.query.bookingMode)) return res.status(400).json({ ok: false, error: 'Unknown booking mode.' });
      filter.bookingMode = req.query.bookingMode;
    }
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable !== 'false';
    if (req.query.minCapacity) {
      const minCapacity = Number(req.query.minCapacity);
      if (!Number.isInteger(minCapacity) || minCapacity < 1) return res.status(400).json({ ok: false, error: 'Minimum capacity must be a positive integer.' });
      filter.capacity = { $gte: minCapacity };
    }
    if (req.query.q) {
      const pattern = new RegExp(String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: pattern }, { category: pattern }, { description: pattern }, { location: pattern }, { 'units.label': pattern }];
    }
    const resources = await Resource.find(filter).sort({ category: 1, name: 1 }).lean();
    res.json({ ok: true, data: resources, meta: { categories: RESOURCE_CATEGORIES } });
  } catch (error) {
    next(error);
  }
}

export async function getResource(req, res, next) {
  try {
    const resource = await Resource.findOne({ _id: req.params.resourceId, institutionSlug: scopedInstitution(req) }).lean();
    if (!resource) return res.status(404).json({ ok: false, error: 'Resource not found' });
    res.json({ ok: true, data: resource });
  } catch (error) {
    next(error);
  }
}

export async function createResource(req, res, next) {
  try {
    const institutionSlug = req.user.institutionSlug;
    if (!institutionBySlug(institutionSlug)) return res.status(400).json({ ok: false, error: 'Your account is not linked to a valid institution.' });
    const payload = resourcePayload(req.body, institutionSlug);
    if (payload.error) return res.status(400).json({ ok: false, error: payload.error });
    const resource = await Resource.create(payload.value);
    res.status(201).json({ ok: true, data: resource });
  } catch (error) {
    next(error);
  }
}

export async function updateResource(req, res, next) {
  try {
    const payload = resourcePayload(req.body, req.user.institutionSlug);
    if (payload.error) return res.status(400).json({ ok: false, error: payload.error });
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.resourceId, institutionSlug: req.user.institutionSlug },
      payload.value,
      { new: true, runValidators: true }
    ).lean();
    if (!resource) return res.status(404).json({ ok: false, error: 'Resource not found' });
    res.json({ ok: true, data: resource });
  } catch (error) {
    next(error);
  }
}
