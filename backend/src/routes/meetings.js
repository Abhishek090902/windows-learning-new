import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { emitDataUpdate } from '../utils/socketEmitter.js';
import { endMeeting, getOrCreateMeeting, handleRecordingReadyWebhook } from '../services/meetingService.js';

const router = express.Router();

router.get('/:sessionId/meeting', protect, async (req, res, next) => {
  try {
    const meeting = await getOrCreateMeeting(req.params.sessionId, req.user);
    emitDataUpdate(req.app.get('io'), meeting.participantUserIds, 'sessions');
    emitDataUpdate(req.app.get('io'), meeting.participantUserIds, 'analytics');
    return sendSuccess(res, meeting, 'Meeting details retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/end-meeting', protect, async (req, res, next) => {
  try {
    const session = await endMeeting(req.params.sessionId, req.user.userId);
    emitDataUpdate(req.app.get('io'), [session.learner.user.id, session.mentor.user.id], 'sessions');
    emitDataUpdate(req.app.get('io'), [session.learner.user.id, session.mentor.user.id], 'analytics');
    return sendSuccess(res, session, 'Meeting ended successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/webhooks/daily', async (req, res, next) => {
  try {
    await handleRecordingReadyWebhook(req.body);
    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
