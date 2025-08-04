import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTurbolegCourse() {
  try {
    console.log('Checking turboleg course schedules...')
    
    const course = await prisma.course.findFirst({
      where: { title: 'turboleg' },
      include: {
        schedules: true,
        enrollments: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })
    
    if (!course) {
      console.log('turboleg course not found')
      return
    }
    
    console.log(`Course: ${course.title}`)
    console.log(`Instructor: ${course.instructor}`)
    console.log(`Start Date: ${course.startDate}`)
    console.log(`Duration: ${course.duration} ${course.durationUnit}`)
    console.log(`Schedules: ${course.schedules.length}`)
    console.log(`Enrollments: ${course.enrollments.length}`)
    console.log('')
    
    if (course.schedules.length > 0) {
      console.log('Schedules:')
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      course.schedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek}) ${schedule.startTime}-${schedule.endTime}`)
      })
    }
    
    if (course.enrollments.length > 0) {
      console.log('\nEnrollments:')
      course.enrollments.forEach((enrollment, index) => {
        console.log(`  ${index + 1}. ${enrollment.user.name} (${enrollment.user.email}) - ${enrollment.status}`)
      })
    }
    
    // Test event generation for this course
    console.log('\nTesting event generation for August 2025:')
    const startDate = new Date('2025-08-11') // Course start date
    const endDate = new Date('2025-08-17')   // One week later
    
    const courseStartDate = new Date(course.startDate)
    const courseEndDate = new Date(courseStartDate)
    courseEndDate.setDate(courseEndDate.getDate() + (course.duration * 7)) // 8 weeks
    
    console.log(`Course period: ${courseStartDate.toDateString()} to ${courseEndDate.toDateString()}`)
    console.log(`Test range: ${startDate.toDateString()} to ${endDate.toDateString()}`)
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for (const schedule of course.schedules) {
      console.log(`\nSchedule for ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek}):`)
      
      // Find the first occurrence of this day of week on or after course start
      let current = new Date(courseStartDate)
      
      // Move to the first occurrence of the scheduled day
      while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
        current.setDate(current.getDate() + 1)
      }
      
      console.log(`  First occurrence: ${current.toDateString()} (day ${current.getDay()})`)
      
      // Generate events in our test range
      while (current <= courseEndDate && current <= endDate) {
        if (current >= startDate) {
          console.log(`  Event: ${current.toDateString()} ${schedule.startTime}-${schedule.endTime}`)
        }
        current.setDate(current.getDate() + 7) // Next week
      }
    }
    
  } catch (error) {
    console.error('Error checking turboleg course:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTurbolegCourse()
