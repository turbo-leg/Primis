import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchedules() {
  try {
    console.log('Connecting to database...')
    
    const schedules = await prisma.schedule.findMany({
      include: {
        course: {
          select: {
            title: true,
            instructor: true
          }
        }
      },
      orderBy: [
        { course: { title: 'asc' } },
        { dayOfWeek: 'asc' }
      ]
    })
    
    console.log('Total schedules found:', schedules.length)
    console.log('\nSchedules:')
    schedules.forEach((schedule, index) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      console.log(`${index + 1}. Course: ${schedule.course.title}`)
      console.log(`   Day: ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek})`)
      console.log(`   Time: ${schedule.startTime} - ${schedule.endTime}`)
      console.log(`   Active: ${schedule.isActive}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error checking schedules:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchedules()
