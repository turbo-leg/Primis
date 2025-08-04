import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testScheduleGeneration() {
  try {
    console.log('Testing schedule event generation...')
    
    // Get the SAT Preparation course which has Mon, Wed, Fri schedule
    const satCourse = await prisma.course.findFirst({
      where: { title: 'SAT Preparation' },
      include: {
        schedules: true,
        enrollments: {
          where: { status: 'ACTIVE' }
        }
      }
    })
    
    if (!satCourse) {
      console.log('SAT Preparation course not found')
      return
    }
    
    console.log(`Course: ${satCourse.title}`)
    console.log(`Start Date: ${satCourse.startDate}`)
    console.log(`Schedules: ${satCourse.schedules.length}`)
    console.log(`Active Enrollments: ${satCourse.enrollments.length}`)
    
    satCourse.schedules.forEach((schedule, index) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      console.log(`  Schedule ${index + 1}: ${dayNames[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}`)
    })
    
    // Test event generation for next week
    const startDate = new Date('2025-08-04') // Monday 
    const endDate = new Date('2025-08-10')   // Sunday
    
    console.log(`\nGenerating events from ${startDate.toDateString()} to ${endDate.toDateString()}:`)
    
    const courseStartDate = new Date(satCourse.startDate)
    const courseEndDate = new Date(courseStartDate)
    courseEndDate.setDate(courseEndDate.getDate() + (satCourse.duration * 7)) // Assuming weeks
    
    const events = []
    
    for (const schedule of satCourse.schedules) {
      console.log(`\nProcessing schedule for day ${schedule.dayOfWeek}:`)
      
      // Find the first occurrence of this day of week on or after course start
      let current = new Date(courseStartDate)
      console.log(`  Course starts: ${current.toDateString()} (day ${current.getDay()})`)
      
      // Move to the first occurrence of the scheduled day
      while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
        current.setDate(current.getDate() + 1)
      }
      
      console.log(`  First occurrence: ${current.toDateString()} (day ${current.getDay()})`)
      
      // Generate weekly recurring events
      let weekCount = 0
      while (current <= courseEndDate && current <= endDate && weekCount < 4) {
        if (current >= startDate) {
          const event = {
            date: current.toISOString().split('T')[0],
            day: current.toDateString(),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayOfWeek: schedule.dayOfWeek
          }
          events.push(event)
          console.log(`    Event: ${event.day} ${event.startTime}-${event.endTime}`)
        }
        
        // Move to next week
        current.setDate(current.getDate() + 7)
        weekCount++
      }
    }
    
    console.log(`\nTotal events generated: ${events.length}`)
    
  } catch (error) {
    console.error('Error testing schedule generation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testScheduleGeneration()
