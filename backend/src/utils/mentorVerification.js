const withStatusClause = (statusClause, extraWhere = {}) => {
  const hasExtraFilters = Object.keys(extraWhere).length > 0;

  return hasExtraFilters
    ? {
        AND: [statusClause, extraWhere],
      }
    : statusClause;
};

export const buildApprovedMentorWhere = (extraWhere = {}) =>
  withStatusClause(
    {
      OR: [
        { verificationStatus: 'approved' },
        { isVerified: true },
      ],
    },
    extraWhere,
  );

export const buildPendingMentorWhere = (extraWhere = {}) =>
  withStatusClause(
    {
      OR: [
        { verificationStatus: 'pending' },
        { isVerified: false, rejectionReason: null },
      ],
    },
    extraWhere,
  );

export const buildRejectedMentorWhere = (extraWhere = {}) =>
  withStatusClause(
    {
      OR: [
        { verificationStatus: 'rejected' },
        { isVerified: false, rejectionReason: { not: null } },
      ],
    },
    extraWhere,
  );

export const getNormalizedVerificationStatus = (mentorProfile) => {
  if (!mentorProfile) return 'pending';

  if (mentorProfile.verificationStatus === 'approved' || mentorProfile.isVerified) {
    return 'verified';
  }

  if (mentorProfile.verificationStatus === 'rejected' || mentorProfile.rejectionReason) {
    return 'rejected';
  }

  return 'pending';
};
