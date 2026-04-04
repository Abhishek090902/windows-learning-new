import crypto from 'crypto';
import prisma from '../config/db.js';

const JITSI_DOMAIN = 'meet.jit.si';

const getSessionWithUsers = async (sessionId) => prisma.session.findUnique({
  where: { id: sessionId },
  include: {
    mentor: {
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    },
    learner: {
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    },
  },
});

export const getAuthorizedSession = async (sessionId, userId) => {
  const session = await getSessionWithUsers(sessionId);
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  const isLearner = session.learner.user.id === userId;
  const isMentor = session.mentor.user.id === userId;
  if (!isLearner && !isMentor) {
    const error = new Error('You are not allowed to access this meeting');
    error.statusCode = 403;
    throw error;
  }

  return session;
};

const buildRoomName = (sessionId) => {
  const randomHash = crypto.randomBytes(4).toString('hex');
  const sessionSuffix = String(sessionId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase();
  return `wl${sessionSuffix}${randomHash}`;
};

const ensureRoom = async (session) => {
  if (session.meetingRoomName && session.meetingUrl) {
    return session;
  }

  const roomName = buildRoomName(session.id);
  const roomUrl = `https://${JITSI_DOMAIN}/${roomName}`;

  return prisma.session.update({
    where: { id: session.id },
    data: {
      meetingLink: roomUrl,
      meetingUrl: roomUrl,
      meetingRoomName: roomName,
    },
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      learner: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
};

export const getOrCreateMeeting = async (sessionId, user) => {
  const session = await getAuthorizedSession(sessionId, user.userId);
  if (!['CONFIRMED', 'ONGOING'].includes(session.status)) {
    const error = new Error('This session is not ready to join yet. Please wait for mentor confirmation.');
    error.statusCode = 400;
    throw error;
  }

  const preparedSession = await ensureRoom(session);
  const isMentor = preparedSession.mentor.user.id === user.userId;

  const updates = {};
  if (!preparedSession.meetingStartedAt) {
    updates.meetingStartedAt = new Date();
  }
  if (preparedSession.status === 'CONFIRMED') {
    updates.status = 'ONGOING';
  }

  const updatedSession = Object.keys(updates).length
    ? await prisma.session.update({
        where: { id: preparedSession.id },
        data: updates,
      })
    : preparedSession;

  return {
    sessionId: preparedSession.id,
    roomName: preparedSession.meetingRoomName,
    roomUrl: preparedSession.meetingUrl,
    autoEndAt: preparedSession.endTime,
    isOwner: isMentor,
    provider: 'JITSI',
    sessionStatus: updatedSession.status,
    participantUserIds: [
      preparedSession.learner.user.id,
      preparedSession.mentor.user.id,
    ],
  };
};

export const endMeeting = async (sessionId, userId) => {
  await getAuthorizedSession(sessionId, userId);

  return prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      meetingEndedAt: new Date(),
    },
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      learner: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
};

export const handleRecordingReadyWebhook = async () => null;
