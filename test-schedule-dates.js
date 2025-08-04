#!/usr/bin/env node

// Test schedule date formatting and matching
const MONGOLIA_TIMEZONE = 'Asia/Ulaanbaatar'

// Test how dates are formatted in frontend vs backend
console.log('=== Schedule Date Formatting Test ===')

// Current time in Mongolia
const mongoliaTime = new Date(new Date().toLocaleString("en-US", { timeZone: MONGOLIA_TIMEZONE }))
console.log('Current Mongolia Time:', mongoliaTime)

// Format date the way frontend does it
const frontendFormat = mongoliaTime.toLocaleString('en-CA', { 
  timeZone: 'Asia/Ulaanbaatar', 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit' 
})
console.log('Frontend Date Format (en-CA):', frontendFormat)

// Format date the way backend should do it
const backendFormat = mongoliaTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Ulaanbaatar' })
console.log('Backend Date Format (en-CA):', backendFormat)

// Test week calculation
console.log('\n=== Week Calculation Test ===')
const startOfWeek = new Date(mongoliaTime)
startOfWeek.setDate(mongoliaTime.getDate() - mongoliaTime.getDay())
console.log('Start of week:', startOfWeek)

const weekDays = []
for (let i = 0; i < 7; i++) {
  const day = new Date(startOfWeek)
  day.setDate(startOfWeek.getDate() + i)
  const dayName = day.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Ulaanbaatar' })
  const dayFormat = day.toLocaleString('en-CA', { 
    timeZone: 'Asia/Ulaanbaatar', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  weekDays.push({ date: day, name: dayName, format: dayFormat })
}

weekDays.forEach((day, index) => {
  console.log(`Day ${index}: ${day.name} - ${day.format}`)
})

// Test day of week numbers
console.log('\n=== Day of Week Numbers ===')
const dayNameToNumber = {
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
  'thursday': 4, 'friday': 5, 'saturday': 6
}

const dayNumberToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

console.log('Day conversions:')
Object.keys(dayNameToNumber).forEach(day => {
  const num = dayNameToNumber[day]
  const backToName = dayNumberToName[num]
  console.log(`${day} -> ${num} -> ${backToName}`)
})

console.log('\nCurrent day info:')
console.log('Mongolia day of week number:', mongoliaTime.getDay())
console.log('Mongolia day name:', dayNumberToName[mongoliaTime.getDay()])
