import * as proposalService from './proposal.service.js';
import { sendSuccess } from '../../utils/responseHandler.js';
import { createNotification } from '../notifications/notification.service.js';
import { emitDataUpdate } from '../../utils/socketEmitter.js';

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.createProposal(req.user.userId, req.body);
    const io = req.app.get('io');
    const learnerUserId = proposal.requirement.learner.user.id;

    const notification = await createNotification(
      learnerUserId,
      'NEW_PROPOSAL',
      `You received a new proposal for "${proposal.requirement.title}".`
    );

    io?.to(`user:${learnerUserId}`).emit('new_notification', notification);
    emitDataUpdate(io, [req.user.userId, learnerUserId], 'proposals');

    return sendSuccess(res, proposal, 'Proposal submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getMentorProposals = async (req, res, next) => {
  try {
    const proposals = await proposalService.getMentorProposals(req.user.userId);
    return sendSuccess(res, proposals, 'Mentor proposals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const acceptProposal = async (req, res, next) => {
  try {
    const result = await proposalService.acceptProposal(req.params.id, req.user.userId);
    const io = req.app.get('io');
    const mentorUserId = result.proposal.mentor.user.id;
    const learnerUserId = result.proposal.requirement.learner.user.id;

    const notification = await createNotification(
      mentorUserId,
      'PROPOSAL_ACCEPTED',
      `Your proposal for "${result.proposal.requirement.title}" was accepted.`
    );

    io?.to(`user:${mentorUserId}`).emit('new_notification', notification);
    emitDataUpdate(io, [mentorUserId, learnerUserId], 'proposals');
    emitDataUpdate(io, [mentorUserId, learnerUserId], 'sessions');

    return sendSuccess(res, result, 'Proposal accepted and session created');
  } catch (error) {
    next(error);
  }
};

export const rejectProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.rejectProposal(req.params.id, req.user.userId);
    const io = req.app.get('io');
    const mentorUserId = proposal.mentor.user.id;
    const learnerUserId = proposal.requirement.learner.user.id;

    emitDataUpdate(io, [mentorUserId, learnerUserId], 'proposals');

    return sendSuccess(res, proposal, 'Proposal rejected successfully');
  } catch (error) {
    next(error);
  }
};
