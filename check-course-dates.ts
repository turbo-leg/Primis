import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCourseDates() {
  try {
    console.log('Checking all course dates...')
    
    const courses = await prisma.course.findMany({
      select: {
        title: true,
        startDate: true,
        duration: true,
        durationUnit: true
      },
      orderBy: { startDate: 'asc' }
    })
    
    const now = new Date()
    console.log(`Current date: ${now.toDateString()}`)
    console.log('')
    
    courses.forEach((course, index) => {
      const startDate = new Date(course.startDate)
      const endDate = new Date(startDate)
      
      // Calculate end date
      switch (course.durationUnit?.toLowerCase()) {
        case 'days':
          endDate.setDate(endDate.getDate() + course.duration)
          break
        case 'weeks':
          endDate.setDate(endDate.getDate() + (course.duration * 7))
          break
        case 'months':
          endDate.setMonth(endDate.getMonth() + course.duration)
          break
        case 'years':
          endDate.setFullYear(endDate.getFullYear() + course.duration)
          break
        default:
          endDate.setDate(endDate.getDate() + (course.duration * 7)) // Default to weeks
      }
      
      const isActive = now >= startDate && now <= endDate
      const status = now < startDate ? 'Future' : (now > endDate ? 'Past' : 'Active')
      
      console.log(`${index + 1}. ${course.title}`)
      console.log(`   Start: ${startDate.toDateString()}`)
      console.log(`   End: ${endDate.toDateString()}`)
      console.log(`   Duration: ${course.duration} ${course.durationUnit}`)
      console.log(`   Status: ${status}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error checking course dates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourseDates()
