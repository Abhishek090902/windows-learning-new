-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'HELD', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('INTERNAL', 'STRIPE', 'RAZORPAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'UPI', 'NETBANKING', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "SessionFundsStatus" AS ENUM ('NONE', 'HELD', 'RELEASED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'ONGOING';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'PAYOUT';
ALTER TYPE "TransactionType" ADD VALUE 'ESCROW_HOLD';
ALTER TYPE "TransactionType" ADD VALUE 'ESCROW_RELEASE';
ALTER TYPE "TransactionType" ADD VALUE 'ESCROW_REFUND';

-- DropIndex
DROP INDEX "MentorProfile_hourlyRate_idx";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LearnerRequirement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MentorAvailability" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MentorProfile" DROP COLUMN "hourlyRate",
ADD COLUMN     "average_rating" DECIMAL(3,2),
ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "completion_rate" DECIMAL(5,2),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "current_company" TEXT,
ADD COLUMN     "current_role" TEXT,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "experience_years" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "free_consultation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "hourly_rate" DECIMAL(10,2),
ADD COLUMN     "id_document" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "packageDeals" JSONB,
ADD COLUMN     "pastExperience" JSONB,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "profile_image" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "response_rate" DECIMAL(5,2),
ADD COLUMN     "response_time" TEXT,
ADD COLUMN     "skillsData" JSONB,
ADD COLUMN     "timeOff" JSONB,
ADD COLUMN     "time_zone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "total_reviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_sessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_students" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verification_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "weeklySchedule" JSONB,
ADD COLUMN     "work_verification" TEXT,
ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "experience" DROP DEFAULT,
DROP COLUMN "languages",
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NotificationSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Proposal" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "helpful_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mentor_response" TEXT,
ADD COLUMN     "mentor_response_at" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "fundsStatus" "SessionFundsStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "meeting_ended_at" TIMESTAMP(3),
ADD COLUMN     "meeting_recording_url" TEXT,
ADD COLUMN     "meeting_room_name" TEXT,
ADD COLUMN     "meeting_started_at" TIMESTAMP(3),
ADD COLUMN     "meeting_url" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Skill" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "availableBalanceAfter" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "externalReference" TEXT,
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "gatewayPayoutId" TEXT,
ADD COLUMN     "heldBalanceAfter" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentMethodLabel" TEXT,
ADD COLUMN     "paymentMethodType" "PaymentMethodType",
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "heldBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "token" TEXT,
    "gatewayCustomerId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
    "type" "PaymentMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "accountHolderName" TEXT,
    "bankName" TEXT,
    "accountNumberLast4" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "token" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "PaymentMethod_provider_idx" ON "PaymentMethod"("provider");

-- CreateIndex
CREATE INDEX "PaymentMethod_type_idx" ON "PaymentMethod"("type");

-- CreateIndex
CREATE INDEX "PaymentMethod_isDefault_idx" ON "PaymentMethod"("isDefault");

-- CreateIndex
CREATE INDEX "PayoutMethod_userId_idx" ON "PayoutMethod"("userId");

-- CreateIndex
CREATE INDEX "PayoutMethod_type_idx" ON "PayoutMethod"("type");

-- CreateIndex
CREATE INDEX "PayoutMethod_isDefault_idx" ON "PayoutMethod"("isDefault");

-- CreateIndex
CREATE INDEX "MentorProfile_verification_status_idx" ON "MentorProfile"("verification_status");

-- CreateIndex
CREATE INDEX "MentorProfile_hourly_rate_idx" ON "MentorProfile"("hourly_rate");

-- CreateIndex
CREATE INDEX "MentorProfile_average_rating_idx" ON "MentorProfile"("average_rating");

-- CreateIndex
CREATE INDEX "MentorProfile_total_sessions_idx" ON "MentorProfile"("total_sessions");

-- CreateIndex
CREATE INDEX "Review_isVerified_idx" ON "Review"("isVerified");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_provider_idx" ON "Transaction"("provider");

-- CreateIndex
CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");

-- CreateIndex
CREATE INDEX "Transaction_externalReference_idx" ON "Transaction"("externalReference");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutMethod" ADD CONSTRAINT "PayoutMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
