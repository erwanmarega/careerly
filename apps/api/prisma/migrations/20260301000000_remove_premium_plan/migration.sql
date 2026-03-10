-- Migration: remove PREMIUM from Plan enum
-- First ensure no users have PREMIUM plan (already done via direct SQL)
UPDATE "User" SET plan = 'PRO' WHERE plan = 'PREMIUM';

-- Rename old enum
ALTER TYPE "Plan" RENAME TO "Plan_old";

-- Create new enum without PREMIUM
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- Migrate column
ALTER TABLE "User" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "plan" TYPE "Plan" USING "plan"::text::"Plan";
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'FREE';

-- Drop old enum
DROP TYPE "Plan_old";
