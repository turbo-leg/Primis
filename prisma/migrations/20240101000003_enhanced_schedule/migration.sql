-- Migration to add schedule-related fields and improve calendar functionality

-- Add assignment due dates to the calendar
-- Assignments table already exists, we'll use dueDate field

-- Add schedule table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    "startTime" TEXT NOT NULL, -- Format: "HH:MM"
    "endTime" TEXT NOT NULL, -- Format: "HH:MM"
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Schedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Schedule_courseId_idx" ON "Schedule"("courseId");
CREATE INDEX IF NOT EXISTS "Schedule_dayOfWeek_idx" ON "Schedule"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "Assignment_dueDate_idx" ON "Assignment"("dueDate");
CREATE INDEX IF NOT EXISTS "Assignment_courseId_idx" ON "Assignment"("courseId");