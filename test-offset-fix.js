#!/usr/bin/env node

// Test -1 offset fix
console.log('=== Testing -1 Day Offset Fix ===')

const getWeekDaysOriginal = (date) => {
  const days = []
  const monday = new Date(date)
  
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(day)
  }
  
  return days
}

const getWeekDaysWithOffset = (date) => {
  const days = []
  const monday = new Date(date)
  
  const dayOfWeek = monday.getDay()
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  monday.setDate(diff)
  
  // Apply -1 day offset
  monday.setDate(monday.getDate() - 1)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(day)
  }
  
  return days
}

const currentDate = new Date('2025-08-03') // Sunday
console.log('Current date:', currentDate.toLocaleDateString('en-US', { weekday: 'long' }))

console.log('\nOriginal week calculation:')
const originalWeek = getWeekDaysOriginal(currentDate)
originalWeek.forEach((day, i) => {
  console.log(`${i}: ${day.toLocaleDateString('en-US', { weekday: 'long' })} ${day.toISOString().split('T')[0]}`)
})

console.log('\nWith -1 offset:')
const offsetWeek = getWeekDaysWithOffset(currentDate)
offsetWeek.forEach((day, i) => {
  console.log(`${i}: ${day.toLocaleDateString('en-US', { weekday: 'long' })} ${day.toISOString().split('T')[0]}`)
})

console.log('\n=== Effect of Offset ===')
console.log('Original Monday column would show:', originalWeek[0].toLocaleDateString('en-US', { weekday: 'long' }))
console.log('With offset Monday column shows:', offsetWeek[0].toLocaleDateString('en-US', { weekday: 'long' }))
console.log('\nSo events that were on Tuesday will now appear on Monday!')
