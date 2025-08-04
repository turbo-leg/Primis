import { PrismaClient } from '@prisma/client'
import { getCurrentMongoliaTime } from './src/lib/timezone'

const prisma = new PrismaClient()

// Helper function to format date for Mongolia timezone without UTC conversion
const formatDateMongolia = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function testDateFormatting() {
  try {
    console.log('🕐 Testing date formatting fix...\n')
    
    // Test specific dates
    const testDates = [
      new Date('2025-08-11T09:00:00+08:00'), // Monday 9AM Mongolia time
      new Date('2025-08-13T09:00:00+08:00'), // Wednesday 9AM Mongolia time  
      new Date('2025-08-15T09:00:00+08:00'), // Friday 9AM Mongolia time
    ]
    
    console.log('Date formatting comparison:')
    testDates.forEach((date, index) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      console.log(`\n${index + 1}. Original date: ${date}`)
      console.log(`   Day of week: ${date.getDay()} (${dayNames[date.getDay()]})`)
      console.log(`   OLD method: ${date.toISOString().split('T')[0]}`)
      console.log(`   NEW method: ${formatDateMongolia(date)}`)
      
      // Check if they're different
      const oldMethod = date.toISOString().split('T')[0]
      const newMethod = formatDateMongolia(date)
      if (oldMethod !== newMethod) {
        console.log(`   ⚠️  DIFFERENCE FOUND! Old vs New: ${oldMethod} vs ${newMethod}`)
      } else {
        console.log(`   ✅ Same result`)
      }
    })
    
    // Test schedule generation simulation
    console.log('\n\nSimulating event generation for dsaDSA course:')
    const course = await prisma.course.findFirst({
      where: { title: 'dsaDSA' },
      include: { schedules: true }
    })
    
    if (course) {
      const courseStartDate = new Date(course.startDate)
      const courseEndDate = new Date(courseStartDate)
      courseEndDate.setDate(courseEndDate.getDate() + (course.duration * 7))
      
      console.log(`Course: ${course.title}`)
      console.log(`Start: ${courseStartDate}`)
      console.log(`End: ${courseEndDate}`)
      
      const start = new Date('2025-08-01')
      const end = new Date('2025-08-31')
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      for (const schedule of course.schedules) {
        console.log(`\nProcessing ${dayNames[schedule.dayOfWeek]} schedule:`)
        
        // Find the first occurrence of this day of week on or after course start
        let current = new Date(courseStartDate)
        
        // Move to the first occurrence of the scheduled day
        while (current.getDay() !== schedule.dayOfWeek && current <= courseEndDate) {
          current.setDate(current.getDate() + 1)
        }
        
        let eventCount = 0
        // Generate weekly recurring events for August
        while (current <= courseEndDate && current <= end && eventCount < 4) {
          if (current >= start) {
            const oldDate = current.toISOString().split('T')[0]
            const newDate = formatDateMongolia(current)
            
            console.log(`  Event ${eventCount + 1}: ${current.toDateString()}`)
            console.log(`    OLD date format: ${oldDate}`)
            console.log(`    NEW date format: ${newDate}`)
            console.log(`    Expected day: ${dayNames[schedule.dayOfWeek]} (${schedule.dayOfWeek})`)
            console.log(`    Actual day: ${dayNames[current.getDay()]} (${current.getDay()})`)
            
            if (current.getDay() !== schedule.dayOfWeek) {
              console.log(`    ⚠️  DAY MISMATCH!`)
            } else {
              console.log(`    ✅ Day matches`)
            }
            
            eventCount++
          }
          
          // Move to next week
          current.setDate(current.getDate() + 7)
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing date formatting:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDateFormatting()
