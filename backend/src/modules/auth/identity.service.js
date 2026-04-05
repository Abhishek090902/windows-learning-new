export const AUTH_PROVIDERS = {
  LEGACY: 'LEGACY',
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE',
  SUPABASE: 'SUPABASE',
};

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const findUserByIdentity = async (prisma, identity, { allowLegacyFallback = true } = {}) => {
  const normalizedEmail = normalizeEmail(identity?.email);
  const authProvider = identity?.authProvider || null;
  const providerUserId = identity?.providerUserId || null;

  if (authProvider && providerUserId) {
    const directMatch = await prisma.user.findFirst({
      where: {
        authProvider,
        providerUserId,
      },
    });

    if (directMatch) {
      return directMatch;
    }
  }

  if (allowLegacyFallback && normalizedEmail) {
    return prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        authProvider: AUTH_PROVIDERS.LEGACY,
      },
    });
  }

  return null;
};

export const claimLegacyIdentity = async (prisma, userId, identity, extraData = {}) => {
  const normalizedEmail = normalizeEmail(identity?.email);

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(identity?.authProvider ? { authProvider: identity.authProvider } : {}),
      ...(identity?.providerUserId ? { providerUserId: identity.providerUserId } : {}),
      ...(extraData.name ? { name: extraData.name } : {}),
      ...(extraData.profilePicture ? { profilePicture: extraData.profilePicture } : {}),
    },
    include: {
      learnerProfile: true,
      mentorProfile: true,
      wallet: true,
      notificationSetting: true,
    },
  });
};
