import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugTimezoneIssue() {
  try {
    console.log('Debugging timezone and day calculation issues...')
    
    // Get the turboleg course schedules
    const course = await prisma.course.findFirst({
      where: { title: 'turboleg' },
      include: { schedules: true }
    })
    
    if (!course) {
      console.log('turboleg course not found')
      return
    }
    
    console.log(`Course: ${course.title}`)
    console.log(`Start Date from DB: ${course.startDate}`)
    console.log(`Start Date ISO: ${course.startDate.toISOString()}`)
    console.log(`Start Date Local: ${course.startDate.toLocaleString()}`)
    console.log(`Start Date Mongolia: ${course.startDate.toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })}`)
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    console.log('\nSchedules in database:')
    course.schedules
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .forEach((schedule, index) => {
        console.log(`  ${index + 1}. Day ${schedule.dayOfWeek} (${dayNames[schedule.dayOfWeek]}) ${schedule.startTime}-${schedule.endTime}`)
      })
    
    // Test date calculations with different approaches
    console.log('\nTesting date calculations:')
    
    const courseStartDate = new Date(course.startDate)
    console.log(`\nCourse start date calculations:`)
    console.log(`  Original: ${courseStartDate.toDateString()} (getDay = ${courseStartDate.getDay()})`)
    console.log(`  ISO: ${courseStartDate.toISOString()}`)
    
    // Test with Mongolia timezone
    const mongoliaDate = new Date(courseStartDate.toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }))
    console.log(`  Mongolia TZ: ${mongoliaDate.toDateString()} (getDay = ${mongoliaDate.getDay()})`)
    
    // Test event generation for Monday schedule (dayOfWeek = 1)
    console.log(`\nTesting Monday schedule (dayOfWeek = 1):`)
    const mondaySchedule = course.schedules.find(s => s.dayOfWeek === 1)
    if (mondaySchedule) {
      // Find first Monday after course start
      let current = new Date(courseStartDate)
      console.log(`  Starting from: ${current.toDateString()} (getDay = ${current.getDay()})`)
      
      // Move to first Monday
      while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1)
        console.log(`    Checking: ${current.toDateString()} (getDay = ${current.getDay()})`)
      }
      
      console.log(`  First Monday: ${current.toDateString()} (getDay = ${current.getDay()})`)
      
      // Generate a few events
      for (let i = 0; i < 3; i++) {
        const eventDate = new Date(current)
        eventDate.setDate(current.getDate() + (i * 7))
        console.log(`    Event ${i + 1}: ${eventDate.toDateString()} ${mondaySchedule.startTime}-${mondaySchedule.endTime}`)
      }
    }
    
    // Test with UTC conversion
    console.log(`\nTesting with UTC conversion:`)
    const utcDate = new Date(course.startDate.getTime() + (course.startDate.getTimezoneOffset() * 60000))
    console.log(`  UTC date: ${utcDate.toDateString()} (getDay = ${utcDate.getDay()})`)
    
    // Test with Mongolia offset (+8 hours)
    const mongoliaOffset = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    const mongoliaDateManual = new Date(utcDate.getTime() + mongoliaOffset)
    console.log(`  Mongolia manual: ${mongoliaDateManual.toDateString()} (getDay = ${mongoliaDateManual.getDay()})`)
    
  } catch (error) {
    console.error('Error debugging timezone issue:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTimezoneIssue()
