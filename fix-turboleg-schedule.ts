import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTurbolegSchedule() {
  try {
    console.log('Fixing turboleg course schedule...')
    
    // Find the turboleg course
    const course = await prisma.course.findFirst({
      where: { title: 'turboleg' },
      include: { schedules: true }
    })
    
    if (!course) {
      console.log('turboleg course not found')
      return
    }
    
    console.log(`Found course: ${course.title}`)
    console.log(`Current schedules: ${course.schedules.length}`)
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    course.schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${dayNames[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}`)
    })
    
    // Check if Monday schedule exists
    const mondaySchedule = course.schedules.find(s => s.dayOfWeek === 1)
    
    if (mondaySchedule) {
      console.log('Monday schedule already exists')
    } else {
      console.log('Adding Monday schedule...')
      
      // Add Monday schedule with the same time as Wednesday/Friday
      const existingSchedule = course.schedules[0] // Use first schedule as template
      
      const newSchedule = await prisma.schedule.create({
        data: {
          courseId: course.id,
          dayOfWeek: 1, // Monday
          startTime: existingSchedule.startTime,
          endTime: existingSchedule.endTime,
          isActive: true
        }
      })
      
      console.log(`Created Monday schedule: ${newSchedule.startTime}-${newSchedule.endTime}`)
    }
    
    // Show updated schedules
    const updatedCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: { schedules: true }
    })
    
    console.log('\nUpdated schedules:')
    updatedCourse?.schedules
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${dayNames[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime}`)
      })
    
    console.log('\nSchedule fix completed!')
    
  } catch (error) {
    console.error('Error fixing schedule:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTurbolegSchedule()
