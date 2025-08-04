import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugDayConversion() {
  try {
    console.log('🐛 Debugging day conversion issue...\n')
    
    // Test the conversion functions from both APIs
    console.log('1. Admin Courses API conversion (lowercase):')
    const adminCoursesConversion = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    
    Object.entries(adminCoursesConversion).forEach(([day, num]) => {
      console.log(`  ${day} -> ${num}`)
    })
    
    console.log('\n2. Admin Schedules API conversion (capitalized):')
    const adminSchedulesConversion = { 
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 
    }
    
    Object.entries(adminSchedulesConversion).forEach(([day, num]) => {
      console.log(`  ${day} -> ${num}`)
    })
    
    console.log('\n3. JavaScript Date.getDay() values:')
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    dayNames.forEach((day, index) => {
      console.log(`  ${day} -> ${index}`)
    })
    
    console.log('\n4. Current turboleg course schedules:')
    const course = await prisma.course.findFirst({
      where: { title: 'turboleg' },
      include: { schedules: true }
    })
    
    if (course) {
      course.schedules.forEach((schedule) => {
        console.log(`  dayOfWeek: ${schedule.dayOfWeek} -> ${dayNames[schedule.dayOfWeek]}`)
      })
    }
    
    console.log('\n5. Testing date generation for August 2025:')
    
    // Test specific dates to see what day they resolve to
    const testDates = [
      '2025-08-11', // Monday
      '2025-08-12', // Tuesday  
      '2025-08-13', // Wednesday
      '2025-08-14', // Thursday
      '2025-08-15', // Friday
    ]
    
    testDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const utcDate = new Date(dateStr + 'T00:00:00.000Z')
      const mongoliaDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }))
      
      console.log(`  ${dateStr}:`)
      console.log(`    Local Date.getDay(): ${date.getDay()} (${dayNames[date.getDay()]})`)
      console.log(`    UTC Date.getDay(): ${utcDate.getDay()} (${dayNames[utcDate.getDay()]})`)
      console.log(`    Mongolia timezone day: ${mongoliaDate.getDay()} (${dayNames[mongoliaDate.getDay()]})`)
    })
    
    console.log('\n6. Testing ISO string generation:')
    const baseDate = new Date('2025-08-11T09:00:00+08:00') // Monday 9AM Mongolia time
    console.log(`  Original date: ${baseDate}`)
    console.log(`  ISO string: ${baseDate.toISOString()}`)
    console.log(`  Date from ISO: ${new Date(baseDate.toISOString())}`)
    console.log(`  Day from ISO: ${new Date(baseDate.toISOString()).getDay()} (${dayNames[new Date(baseDate.toISOString()).getDay()]})`)
    console.log(`  Date split: ${baseDate.toISOString().split('T')[0]}`)
    
  } catch (error) {
    console.error('Error debugging day conversion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDayConversion()
