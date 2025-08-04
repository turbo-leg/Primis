#!/usr/bin/env node

// Test day offset issue
const MONGOLIA_TIMEZONE = 'Asia/Ulaanbaatar'

console.log('=== Day Offset Test ===')

// Current time in Mongolia
const mongoliaTime = new Date(new Date().toLocaleString("en-US", { timeZone: MONGOLIA_TIMEZONE }))
console.log('Current Mongolia Time:', mongoliaTime)
console.log('Current Day of Week (0=Sunday):', mongoliaTime.getDay())

// Test the getWeekDays function logic
const getWeekDays = (date) => {
  const days = []
  const monday = new Date(date)
  
  // Get Monday of current week
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  console.log('Calculated Monday:', monday)
  console.log('Monday Day of Week:', monday.getDay())
  
  // Generate 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(day)
  }
  
  return days
}

const weekDays = getWeekDays(mongoliaTime)
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

console.log('\n=== Generated Week Days ===')
weekDays.forEach((day, index) => {
  const actualDayName = day.toLocaleDateString('en-US', { weekday: 'long', timeZone: MONGOLIA_TIMEZONE })
  const expectedDayName = dayNames[index]
  const dateStr = day.toLocaleDateString('en-CA', { timeZone: MONGOLIA_TIMEZONE })
  console.log(`Index ${index}: Expected ${expectedDayName}, Actual ${actualDayName}, Date: ${dateStr}`)
})

// Test day of week mapping from backend
console.log('\n=== Backend Day Numbers ===')
const backendDays = {
  0: 'Sunday',
  1: 'Monday', 
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
}

// If backend stores Monday=1, Wednesday=3, Friday=5
console.log('Backend Monday (1):', backendDays[1])
console.log('Backend Wednesday (3):', backendDays[3]) 
console.log('Backend Friday (5):', backendDays[5])

// Check what JavaScript day numbers these correspond to
console.log('\nJavaScript Date.getDay() values:')
console.log('Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6')

// Test if there's an offset needed
console.log('\n=== Offset Test ===')
const testDate = new Date('2025-08-05') // A Tuesday
console.log('Test date (2025-08-05):', testDate.toLocaleDateString('en-US', { weekday: 'long' }))
console.log('JavaScript getDay():', testDate.getDay()) // Should be 2 for Tuesday

// If backend says Monday=1, but JavaScript Monday=1, they should match
// If events show on Tuesday instead of Monday, there might be a date parsing issue
