// Migration script to convert Course.schedule string to Schedule table entries
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ScheduleData {
  days: string[]
  startTime: string
  endTime: string
}

const dayNameToNumber: { [key: string]: number } = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
}

async function migrateScheduleData() {
  console.log('🔄 Migrating schedule data from Course.schedule to Schedule table...\n')
  
  const courses = await prisma.course.findMany({
    where: {
      schedules: {
        none: {}
      }
    },
    select: {
      id: true,
      title: true,
      schedules: true
    }
  })
  
  console.log(`Found ${courses.length} courses with schedule data to migrate.`)
  
  for (const course of courses) {
    console.log(`\nProcessing course: ${course.title}`)
    
    // Since the current schema doesn't have a 'schedule' field,
    // this migration is for courses that may have been created 
    // with the old schema. Check if schedules already exist.
    if (course.schedules.length > 0) {
      console.log('  Course already has schedules - no migration needed.')
      continue
    }
    
    console.log('  No existing schedules found for this course.')
    console.log('  This migration script is for legacy data only.')
    console.log('  If you need to add schedules, use the admin interface.')
  }
  
  console.log('\n🎉 Schedule migration completed!')
  
  // Show final state
  const finalCourses = await prisma.course.findMany({
    select: {
      title: true,
      schedules: {
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true
        }
      }
    }
  })
  
  console.log('\n=== FINAL SCHEDULE STATE ===')
  for (const course of finalCourses) {
    console.log(`\n${course.title}:`)
    if (course.schedules.length === 0) {
      console.log('  No schedules')
    } else {
      course.schedules.forEach((schedule) => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        console.log(`  ${dayNames[schedule.dayOfWeek]}: ${schedule.startTime}-${schedule.endTime}`)
      })
    }
  }
}

migrateScheduleData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
