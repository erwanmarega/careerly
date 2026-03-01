-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing users as having completed onboarding
UPDATE "User" SET "onboardingCompleted" = true;
