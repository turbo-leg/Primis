// Inspect current schedule data structure
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function inspectScheduleData() {
  console.log('🔍 Inspecting schedule data...\n')
  
  // Check Schedule table entries
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      schedules: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true
        }
      }
    }
  })
  
  console.log('=== COURSES WITH SCHEDULE DATA ===')
  for (const course of courses) {
    console.log(`\nCourse: ${course.title}`)
    console.log(`Schedule table entries: ${course.schedules.length}`)
    if (course.schedules.length > 0) {
      course.schedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. Day ${schedule.dayOfWeek}: ${schedule.startTime}-${schedule.endTime} (Active: ${schedule.isActive})`)
      })
    }
  }
  
  // Check if there are any orphaned Schedule entries
  const allSchedules = await prisma.schedule.findMany({
    include: {
      course: {
        select: {
          title: true
        }
      }
    }
  })
  
  console.log(`\n=== ALL SCHEDULE TABLE ENTRIES (${allSchedules.length}) ===`)
  allSchedules.forEach((schedule) => {
    console.log(`Schedule ${schedule.id}: Course "${schedule.course.title}" - Day ${schedule.dayOfWeek}: ${schedule.startTime}-${schedule.endTime}`)
  })
}

inspectScheduleData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
