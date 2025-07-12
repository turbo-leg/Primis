-- Add missing fields to Schedule table
ALTER TABLE "Schedule" ADD COLUMN "instructor" TEXT NOT NULL DEFAULT 'TBD';
ALTER TABLE "Schedule" ADD COLUMN "maxCapacity" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Schedule" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update dayOfWeek to be text instead of integer if needed
-- This might require data migration depending on current state