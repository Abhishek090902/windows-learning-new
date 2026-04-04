import { sendSuccess } from '../../utils/responseHandler.js';
import * as skillService from './skill.service.js';

export const getSkills = async (_req, res, next) => {
  try {
    const skills = await skillService.getAllSkills();
    return sendSuccess(res, skills, 'Skills retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getSkillsGrouped = async (_req, res, next) => {
  try {
    const categories = await skillService.getSkillsGroupedByCategory();
    return sendSuccess(res, categories, 'Skills grouped by category retrieved successfully');
  } catch (error) {
    next(error);
  }
};
