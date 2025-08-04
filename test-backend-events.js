#!/usr/bin/env node

// Test backend date generation logic
console.log('=== Backend Event Generation Test ===')

// Simulate backend logic from schedule route
const formatDateMongolia = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Test course with Monday schedule (dayOfWeek = 1)
const courseStartDate = new Date('2025-07-28') // This is a Monday
const courseEndDate = new Date('2025-08-31')
const scheduleDay = 1 // Monday in backend (1 = Monday)

console.log('Course start date:', courseStartDate.toLocaleDateString('en-US', { weekday: 'long' }), courseStartDate.toISOString().split('T')[0])
console.log('Schedule day number:', scheduleDay, '(should be Monday)')

// Generate events like the backend does
const events = []
let current = new Date(courseStartDate)

// Move to the first occurrence of the scheduled day
while (current.getDay() !== scheduleDay && current <= courseEndDate) {
  current.setDate(current.getDate() + 1)
}

console.log('\nFirst occurrence of scheduled day:', current.toLocaleDateString('en-US', { weekday: 'long' }), formatDateMongolia(current))

// Generate weekly recurring events
let count = 0
while (current <= courseEndDate && count < 5) { // Just first 5 for testing
  const eventDate = formatDateMongolia(current)
  const dayName = current.toLocaleDateString('en-US', { weekday: 'long' })
  events.push({
    date: eventDate,
    dayName: dayName,
    jsDay: current.getDay()
  })
  
  console.log(`Event ${count + 1}: ${eventDate} (${dayName}, JS day: ${current.getDay()})`)
  
  // Move to next week
  current.setDate(current.getDate() + 7)
  count++
}

console.log('\n=== Summary ===')
console.log('Backend dayOfWeek = 1 should generate events on Mondays')
console.log('Generated events:')
events.forEach(event => {
  console.log(`  ${event.date} - ${event.dayName} (JS day: ${event.jsDay})`)
})

// Test what happens if we have the wrong dayOfWeek
console.log('\n=== Testing Wrong Day ===')
const wrongDay = 2 // Tuesday
current = new Date(courseStartDate)
while (current.getDay() !== wrongDay && current <= courseEndDate) {
  current.setDate(current.getDate() + 1)
}
console.log('If dayOfWeek was 2 (Tuesday), first event would be:', current.toLocaleDateString('en-US', { weekday: 'long' }), formatDateMongolia(current))
