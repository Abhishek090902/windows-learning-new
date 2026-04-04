import * as sessionService from './session.service.js';
import { sendSuccess } from '../../utils/responseHandler.js';
import { createNotification } from '../notifications/notification.service.js';
import { emitDataUpdate } from '../../utils/socketEmitter.js';

export const bookSession = async (req, res, next) => {
  try {
    const { mentorId, startTime, endTime, topic, meetingLink } = req.body;
    const session = await sessionService.createSession(
      req.user.userId,
      mentorId,
      startTime,
      endTime,
      topic,
      meetingLink
    );

    const io = req.app.get('io');
    const mentorUserId = session.mentor.user.id;
    const learnerUserId = session.learner.user.id;
    
    // Emit notification
    const notification = await createNotification(
      mentorUserId,
      'SESSION_REQUEST',
      'New session request from learner'
    );
    io.to(`user:${mentorUserId}`).emit('new_notification', notification);

    // Real-time sync for both parties
    emitDataUpdate(io, [learnerUserId, mentorUserId], 'sessions');

    return sendSuccess(res, session, 'Session request sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getLearnerSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getLearnerSessions(req.user.userId);
    return sendSuccess(res, sessions, 'Learner sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getMentorSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getMentorSessions(req.user.userId);
    return sendSuccess(res, sessions, 'Mentor sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const cancelSession = async (req, res, next) => {
  try {
    const existingSession = await sessionService.getSessionById(req.params.id);
    if (!existingSession) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    const actorId = req.user.userId;
    const canCancel = actorId === existingSession.learner.user.id || actorId === existingSession.mentor.user.id;
    if (!canCancel) {
      const error = new Error('You are not allowed to cancel this session');
      error.statusCode = 403;
      throw error;
    }

    const session = await sessionService.updateSessionStatus(req.params.id, 'CANCELLED');
    
    const io = req.app.get('io');
    emitDataUpdate(io, [session.learner.user.id, session.mentor.user.id], 'sessions');
    emitDataUpdate(io, [session.learner.user.id, session.mentor.user.id], 'analytics');

    const recipientId = actorId === session.learner.user.id ? session.mentor.user.id : session.learner.user.id;
    const notification = await createNotification(recipientId, 'SESSION_CANCELLED', 'A session was cancelled');
    io.to(`user:${recipientId}`).emit('new_notification', notification);
    
    return sendSuccess(res, session, 'Session cancelled successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatus = async (req, res, next) => {
  try {
    const nextStatus = req.body.status;
    const existingSession = await sessionService.getSessionById(req.params.id);
    if (!existingSession) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    const actorId = req.user.userId;
    const isMentor = actorId === existingSession.mentor.user.id;
    const isLearner = actorId === existingSession.learner.user.id;

    if (!isMentor && !isLearner) {
      const error = new Error('You are not allowed to update this session');
      error.statusCode = 403;
      throw error;
    }

    if (nextStatus === 'CONFIRMED' && !isMentor) {
      const error = new Error('Only the mentor can accept this session');
      error.statusCode = 403;
      throw error;
    }

    if (nextStatus === 'COMPLETED' && !isMentor) {
      const error = new Error('Only the mentor can complete this session');
      error.statusCode = 403;
      throw error;
    }

    if (nextStatus === 'CANCELLED' && !isMentor && !isLearner) {
      const error = new Error('Only session participants can cancel this session');
      error.statusCode = 403;
      throw error;
    }

    const session = await sessionService.updateSessionStatus(req.params.id, nextStatus);
    const io = req.app.get('io');

    emitDataUpdate(io, [session.learner.user.id, session.mentor.user.id], 'sessions');
    emitDataUpdate(io, [session.learner.user.id, session.mentor.user.id], 'wallet');
    emitDataUpdate(io, [session.learner.user.id, session.mentor.user.id], 'analytics');

    let notification = null;
    if (nextStatus === 'CONFIRMED') {
      notification = await createNotification(session.learner.user.id, 'SESSION_CONFIRMED', 'Your mentor accepted the session request');
      io.to(`user:${session.learner.user.id}`).emit('new_notification', notification);
    }

    if (nextStatus === 'CANCELLED') {
      const recipientId = actorId === session.learner.user.id ? session.mentor.user.id : session.learner.user.id;
      notification = await createNotification(recipientId, 'SESSION_CANCELLED', 'A session was cancelled');
      io.to(`user:${recipientId}`).emit('new_notification', notification);
    }

    return sendSuccess(res, session, 'Session status updated successfully');
  } catch (error) {
    next(error);
  }
};
