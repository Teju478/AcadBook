import { Router } from 'express';
import { createResource, getResource, listResources, updateResource } from '../controllers/resourceController.js';
import { getResourceAvailability } from '../controllers/availabilityController.js';
import { requireDatabase } from '../middleware/databaseGuard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const resourceRouter = Router();
resourceRouter.use(requireDatabase, requireAuth);
resourceRouter.get('/', requireRole('user', 'admin'), listResources);
resourceRouter.get('/:resourceId/availability', requireRole('user', 'admin'), getResourceAvailability);
resourceRouter.get('/:resourceId', requireRole('user', 'admin'), getResource);
resourceRouter.post('/', requireRole('admin'), createResource);
resourceRouter.patch('/:resourceId', requireRole('admin'), updateResource);
