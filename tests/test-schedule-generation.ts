// Simple test to debug the schedule API
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testScheduleGeneration() {
  console.log('🧪 Testing schedule generation logic...\n')
  
  // Get a user with enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      course: {
        include: {
          schedules: {
            where: { isActive: true }
          },
          assignments: {
            where: {
              dueDate: {
                gte: new Date()
              }
            }
          }
        }
      }
    },
    take: 1
  })

  if (enrollments.length === 0) {
    console.log('❌ No active enrollments found')
    return
  }

  const enrollment = enrollments[0]
  const course = enrollment.course
  
  console.log(`📚 Testing with user enrolled in: ${course.title}`)
  console.log(`📅 Course start date: ${course.startDate}`)
  console.log(`🕐 Schedules: ${course.schedules.length}`)
  
  course.schedules.forEach((schedule, index) => {
    console.log(`   ${index + 1}. Day ${schedule.dayOfWeek}: ${schedule.startTime}-${schedule.endTime}`)
  })
  
  // Generate events for the next 30 days
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)
  
  console.log(`\n📆 Generating events from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
  
  const events = []
  
  // Calculate course end date
  const courseStartDate = new Date(course.startDate)
  const courseEndDate = new Date(courseStartDate)
  
  switch (course.durationUnit.toLowerCase()) {
    case 'days':
      courseEndDate.setDate(courseEndDate.getDate() + course.duration)
      break
    case 'weeks':
      courseEndDate.setDate(courseEndDate.getDate() + (course.duration * 7))
      break
    case 'months':
      courseEndDate.setMonth(courseEndDate.getMonth() + course.duration)
      break
    case 'years':
      courseEndDate.setFullYear(courseEndDate.getFullYear() + course.duration)
      break
  }
  
  console.log(`📅 Course runs until: ${courseEndDate.toISOString().split('T')[0]}`)
  
  // Generate class events
  for (const schedule of course.schedules) {
    const current = new Date(Math.max(courseStartDate.getTime(), startDate.getTime()))
    
    // Move to the first occurrence of this day of week
    while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
      current.setDate(current.getDate() + 1)
    }
    
    // Generate all occurrences within the date range
    while (current <= courseEndDate && current <= endDate) {
      if (current >= startDate) {
        events.push({
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
        })
      }
      
      // Move to next week
      current.setDate(current.getDate() + 7)
    }
  }
  
  // Add assignment due dates
  for (const assignment of course.assignments) {
    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate)
      if (dueDate >= startDate && dueDate <= endDate) {
        events.push({
          id: `assignment-${assignment.id}`,
          title: `Due: ${assignment.title}`,
          courseTitle: course.title,
          startTime: '23:59',
          endTime: '23:59',
          date: dueDate.toISOString().split('T')[0],
          instructor: course.instructor || 'TBD',
          type: 'ASSIGNMENT',
          isEnrolled: true,
          courseId: course.id,
          description: assignment.description || '',
          assignmentId: assignment.id,
          maxPoints: assignment.maxPoints,
          color: 'red'
        })
      }
    }
  }
  
  console.log(`\n🎯 Generated ${events.length} events:`)
  events.forEach((event, index) => {
    console.log(`   ${index + 1}. ${event.date} ${event.startTime}-${event.endTime}: ${event.title} (${event.type})`)
  })
}

testScheduleGeneration()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
