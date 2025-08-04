import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testUserSchedule() {
  try {
    console.log('Testing user schedule for Bob Smith...')
    
    // Get Bob Smith's enrollments
    const user = await prisma.user.findUnique({
      where: { email: 'bob.smith@email.com' },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: {
              include: {
                schedules: true
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      console.log('Bob Smith not found')
      return
    }
    
    console.log(`User: ${user.name} (${user.email})`)
    console.log(`Active enrollments: ${user.enrollments.length}`)
    console.log('')
    
    // Generate schedule events like the API does
    const events = []
    const start = new Date('2025-08-01')
    const end = new Date('2025-08-31')
    
    for (const enrollment of user.enrollments) {
      const course = enrollment.course
      
      console.log(`Processing course: ${course.title}`)
      console.log(`  Start date: ${course.startDate}`)
      console.log(`  Schedules: ${course.schedules.length}`)
      
      if (!course.startDate || !course.schedules || course.schedules.length === 0) {
        console.log('  Skipping - no schedules')
        continue
      }
      
      const courseStartDate = new Date(course.startDate)
      const courseEndDate = new Date(courseStartDate)
      courseEndDate.setDate(courseEndDate.getDate() + (course.duration * 7))
      
      console.log(`  Course end date: ${courseEndDate}`)
      
      // Generate events for each schedule
      for (const schedule of course.schedules) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        console.log(`  Processing ${dayNames[schedule.dayOfWeek]} schedule`)
        
        // Find the first occurrence of this day of week on or after course start
        let current = new Date(courseStartDate)
        
        // Move to the first occurrence of the scheduled day
        while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
          current.setDate(current.getDate() + 1)
        }
        
        // Generate weekly recurring events
        while (current <= courseEndDate && current <= end) {
          if (current >= start) {
            const event = {
              id: `course-${course.id}-${schedule.dayOfWeek}-${current.toISOString().split('T')[0]}`,
              title: course.title,
              courseTitle: course.title,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              date: current.toISOString().split('T')[0],
              instructor: course.instructor || 'TBD',
              type: 'CLASS',
              isEnrolled: true,
              courseId: course.id,
              description: course.description || '',
              color: 'blue'
            }
            events.push(event)
            console.log(`    Generated event: ${current.toDateString()} ${schedule.startTime}-${schedule.endTime}`)
          }
          
          // Move to next week
          current.setDate(current.getDate() + 7)
        }
      }
    }
    
    console.log(`\nTotal events generated for Bob Smith: ${events.length}`)
    
    // Show first few events
    console.log('\nFirst 5 events:')
    events.slice(0, 5).forEach((event, index) => {
      const date = new Date(event.date)
      console.log(`${index + 1}. ${date.toDateString()} ${event.startTime}-${event.endTime} - ${event.title}`)
    })
    
  } catch (error) {
    console.error('Error testing user schedule:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserSchedule()
