import { Router } from 'express';
import { getInstitution, listInstitutions } from '../controllers/institutionController.js';

export const institutionRouter = Router();
institutionRouter.get('/', listInstitutions);
institutionRouter.get('/:slug', getInstitution);
