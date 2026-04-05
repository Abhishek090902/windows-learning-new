CREATE TYPE "AuthProvider" AS ENUM ('LEGACY', 'EMAIL', 'GOOGLE', 'SUPABASE');

ALTER TABLE "User"
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "providerUserId" TEXT;

UPDATE "User"
SET "email" = LOWER(TRIM("email"));

UPDATE "User"
SET "providerUserId" = "id"
WHERE "providerUserId" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "providerUserId" SET NOT NULL;

DROP INDEX "User_email_key";

CREATE UNIQUE INDEX "User_authProvider_providerUserId_key" ON "User"("authProvider", "providerUserId");
CREATE INDEX "User_email_authProvider_idx" ON "User"("email", "authProvider");
