import express from 'express';
import * as skillController from './skill.controller.js';

const router = express.Router();

router.get('/', skillController.getSkills);
router.get('/grouped', skillController.getSkillsGrouped);

export default router;
