import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testScheduleAPI() {
  try {
    console.log('Testing actual schedule API response...')
    
    // Simulate the schedule API logic
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            schedules: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })
    
    console.log(`Found ${enrollments.length} active enrollments`)
    
    // Generate schedule events for August 2025
    const events = []
    const start = new Date('2025-08-01T00:00:00.000Z')
    const end = new Date('2025-08-31T23:59:59.999Z')
    
    console.log(`Generating events from ${start.toISOString()} to ${end.toISOString()}`)
    
    for (const enrollment of enrollments) {
      const course = enrollment.course
      
      if (course.title !== 'turboleg') continue // Focus on turboleg
      
      console.log(`\nProcessing course: ${course.title}`)
      console.log(`  Course start: ${course.startDate}`)
      console.log(`  Course start ISO: ${course.startDate.toISOString()}`)
      
      if (!course.startDate || !course.schedules || course.schedules.length === 0) {
        console.log('  Skipping - no schedules')
        continue
      }
      
      const courseStartDate = new Date(course.startDate)
      const courseEndDate = new Date(courseStartDate)
      courseEndDate.setDate(courseEndDate.getDate() + (course.duration * 7))
      
      // Generate events for each schedule
      for (const schedule of course.schedules) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        console.log(`\n  Processing ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek}) schedule:`)
        
        // Find the first occurrence of this day of week on or after course start
        let current = new Date(courseStartDate)
        console.log(`    Starting from: ${current.toISOString()} (${current.toDateString()}, getDay=${current.getDay()})`)
        
        // Move to the first occurrence of the scheduled day
        while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
          current.setDate(current.getDate() + 1)
        }
        
        console.log(`    First occurrence: ${current.toISOString()} (${current.toDateString()}, getDay=${current.getDay()})`)
        
        // Generate weekly recurring events
        let eventCount = 0
        while (current <= courseEndDate && current <= end && eventCount < 5) {
          if (current >= start) {
            const eventDate = current.toISOString().split('T')[0]
            const event = {
              id: `course-${course.id}-${schedule.dayOfWeek}-${eventDate}`,
              title: course.title,
              courseTitle: course.title,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              date: eventDate,
              instructor: course.instructor || 'TBD',
              type: 'CLASS',
              isEnrolled: true,
              courseId: course.id,
              description: course.description || '',
              color: 'blue'
            }
            events.push(event)
            
            // Check what day this date represents
            const checkDate = new Date(eventDate + 'T00:00:00.000Z')
            const localDate = new Date(eventDate + 'T00:00:00')
            console.log(`      Event: ${eventDate}`)
            console.log(`        UTC interpretation: ${checkDate.toDateString()} (getDay=${checkDate.getDay()})`)
            console.log(`        Local interpretation: ${localDate.toDateString()} (getDay=${localDate.getDay()})`)
            console.log(`        Mongolia interpretation: ${checkDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ulaanbaatar', weekday: 'long' })}`)
          }
          
          // Move to next week
          current.setDate(current.getDate() + 7)
          eventCount++
        }
      }
    }
    
    console.log(`\nTotal events generated: ${events.length}`)
    console.log('\nFirst few events:')
    events.slice(0, 5).forEach((event, index) => {
      const eventDate = new Date(event.date + 'T00:00:00.000Z')
      const localEventDate = new Date(event.date + 'T00:00:00')
      console.log(`${index + 1}. ${event.date} (UTC: ${eventDate.toDateString()}, Local: ${localEventDate.toDateString()}) - ${event.startTime}`)
    })
    
  } catch (error) {
    console.error('Error testing schedule API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testScheduleAPI()
