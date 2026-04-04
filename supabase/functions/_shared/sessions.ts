import { getNeonSql } from './neon.ts';
import { HttpError } from './http.ts';
import { createId } from './ids.ts';
import type { AuthContext } from './auth.ts';

type CreateSessionInput = {
  mentorId: string;
  startTime: string;
  endTime: string;
  topic?: string;
  meetingLink?: string | null;
};

const SESSION_SELECT = `
  select
    s.id,
    s."mentorId",
    s."learnerId",
    s."startTime",
    s."endTime",
    s.topic,
    s.amount,
    s.status,
    s."meetingLink",
    s."meeting_url" as "meetingUrl",
    s."meeting_room_name" as "meetingRoomName",
    s."meeting_recording_url" as "meetingRecordingUrl",
    s."meeting_started_at" as "meetingStartedAt",
    s."meeting_ended_at" as "meetingEndedAt",
    s."fundsStatus",
    s."createdAt",
    s."updatedAt",
    mu.id as "mentorUserId",
    mu.name as "mentorUserName",
    mu.email as "mentorUserEmail",
    lu.id as "learnerUserId",
    lu.name as "learnerUserName",
    lu.email as "learnerUserEmail",
    r.id as "reviewId",
    r.rating as "reviewRating"
  from "Session" s
  join "MentorProfile" m on m.id = s."mentorId"
  join "User" mu on mu.id = m."userId"
  join "LearnerProfile" l on l.id = s."learnerId"
  join "User" lu on lu.id = l."userId"
  left join "Review" r on r."sessionId" = s.id
`;

const mapSession = (row: Record<string, unknown>) => ({
  id: row.id,
  mentorId: row.mentorId,
  learnerId: row.learnerId,
  startTime: row.startTime,
  endTime: row.endTime,
  topic: row.topic,
  amount: Number(row.amount || 0),
  status: row.status,
  meetingLink: row.meetingLink,
  meetingUrl: row.meetingUrl,
  meetingRoomName: row.meetingRoomName,
  meetingRecordingUrl: row.meetingRecordingUrl,
  meetingStartedAt: row.meetingStartedAt,
  meetingEndedAt: row.meetingEndedAt,
  fundsStatus: row.fundsStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  mentor: {
    id: row.mentorId,
    user: {
      id: row.mentorUserId,
      name: row.mentorUserName,
      email: row.mentorUserEmail,
    },
  },
  learner: {
    id: row.learnerId,
    user: {
      id: row.learnerUserId,
      name: row.learnerUserName,
      email: row.learnerUserEmail,
    },
  },
  review: row.reviewId
    ? {
        id: row.reviewId,
        rating: row.reviewRating,
      }
    : null,
});

export const createSession = async (auth: AuthContext, input: CreateSessionInput) => {
  const sql = getNeonSql();

  if (auth.role !== 'LEARNER') {
    throw new HttpError(403, 'Only learners can create sessions');
  }

  const { mentorId, startTime, endTime, topic, meetingLink } = input;

  if (!mentorId || !startTime || !endTime) {
    throw new HttpError(400, 'mentorId, startTime, and endTime are required');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HttpError(400, 'Invalid session start or end time');
  }

  if (end <= start) {
    throw new HttpError(400, 'endTime must be after startTime');
  }

  const learnerProfiles = await sql`
    select id
    from "LearnerProfile"
    where "userId" = ${auth.appUserId}
    limit 1
  `;

  if (!learnerProfiles.length) {
    throw new HttpError(404, 'Learner profile not found');
  }

  const mentors = await sql`
    select id, "hourly_rate" as "hourlyRate", "userId"
    from "MentorProfile"
    where id = ${mentorId}
    limit 1
  `;

  if (!mentors.length) {
    throw new HttpError(404, 'Mentor not found');
  }

  const overlaps = await sql`
    select id
    from "Session"
    where "mentorId" = ${mentorId}
      and status <> 'CANCELLED'::"SessionStatus"
      and "startTime" < ${end.toISOString()}::timestamp
      and "endTime" > ${start.toISOString()}::timestamp
    limit 1
  `;

  if (overlaps.length) {
    throw new HttpError(409, 'Slot already booked');
  }

  const sessionId = createId();
  const amount = Number(mentors[0].hourlyRate || 0);

  await sql`
    insert into "Session" (
      id,
      "mentorId",
      "learnerId",
      "startTime",
      "endTime",
      topic,
      amount,
      "meetingLink",
      status,
      "fundsStatus",
      "isActive",
      "createdAt",
      "updatedAt"
    )
    values (
      ${sessionId},
      ${mentorId},
      ${learnerProfiles[0].id},
      ${start.toISOString()}::timestamp,
      ${end.toISOString()}::timestamp,
      ${topic || null},
      ${amount},
      ${meetingLink || null},
      'PENDING'::"SessionStatus",
      'NONE'::"SessionFundsStatus",
      true,
      now(),
      now()
    )
  `;

  return getSessionById(sessionId);
};

export const getSessionById = async (sessionId: string) => {
  const sql = getNeonSql();
  const rows = await sql.unsafe(`
    ${SESSION_SELECT}
    where s.id = $1
    limit 1
  `, [sessionId]);

  if (!rows.length) {
    throw new HttpError(404, 'Session not found');
  }

  return mapSession(rows[0] as Record<string, unknown>);
};

export const getUserSessions = async (auth: AuthContext) => {
  const sql = getNeonSql();

  const profileRows = auth.role === 'MENTOR'
    ? await sql`
        select id from "MentorProfile" where "userId" = ${auth.appUserId} limit 1
      `
    : await sql`
        select id from "LearnerProfile" where "userId" = ${auth.appUserId} limit 1
      `;

  if (!profileRows.length) {
    throw new HttpError(404, `${auth.role === 'MENTOR' ? 'Mentor' : 'Learner'} profile not found`);
  }

  const predicate = auth.role === 'MENTOR'
    ? `s."mentorId" = $1`
    : `s."learnerId" = $1`;

  const rows = await sql.unsafe(`
    ${SESSION_SELECT}
    where ${predicate}
    order by s."startTime" desc
  `, [profileRows[0].id]);

  return rows.map((row) => mapSession(row as Record<string, unknown>));
};

export const updateSessionStatus = async (auth: AuthContext, sessionId: string, status: string) => {
  const nextStatus = String(status || '').toUpperCase();
  const allowedStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'ONGOING'];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new HttpError(400, 'Unsupported session status');
  }

  const session = await getSessionById(sessionId);
  const isMentor = session.mentor.user.id === auth.appUserId;
  const isLearner = session.learner.user.id === auth.appUserId;

  if (!isMentor && !isLearner) {
    throw new HttpError(403, 'You are not allowed to update this session');
  }

  if ((nextStatus === 'CONFIRMED' || nextStatus === 'COMPLETED' || nextStatus === 'ONGOING') && !isMentor) {
    throw new HttpError(403, 'Only the mentor can set this session status');
  }

  const sql = getNeonSql();
  await sql`
    update "Session"
    set status = ${nextStatus}::"SessionStatus",
        "updatedAt" = now()
    where id = ${sessionId}
  `;

  return getSessionById(sessionId);
};
