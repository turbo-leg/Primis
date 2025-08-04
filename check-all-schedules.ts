import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllSchedules() {
  try {
    console.log('Checking all schedules in database...\n')
    
    const schedules = await prisma.schedule.findMany({
      include: {
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { course: { title: 'asc' } },
        { dayOfWeek: 'asc' }
      ]
    })
    
    console.log(`Total schedules found: ${schedules.length}\n`)
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    const schedulesByCourse = schedules.reduce((acc, schedule) => {
      const courseTitle = schedule.course.title
      if (!acc[courseTitle]) {
        acc[courseTitle] = []
      }
      acc[courseTitle].push(schedule)
      return acc
    }, {} as Record<string, any[]>)
    
    Object.entries(schedulesByCourse).forEach(([courseTitle, courseSchedules]) => {
      console.log(`📚 ${courseTitle}: ${courseSchedules.length} schedules`)
      courseSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek}) ${schedule.startTime}-${schedule.endTime}`)
      })
      console.log('')
    })
    
  } catch (error) {
    console.error('Error checking schedules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllSchedules()
