import { Router } from 'express';
import { getAllProjects, getProjectById } from '../controllers/projectController.js';

const router = Router();

router.get('/', getAllProjects);
router.get('/:id', getProjectById);

export default router;
