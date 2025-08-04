// Test script to simulate course creation with multiple days
const testScheduleCreation = () => {
  const schedule = {
    days: ['monday', 'wednesday', 'friday'],
    startTime: '10:00',
    endTime: '11:30'
  }
  
  const dayNameToNumber = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }
  
  const scheduleDays = schedule.days.map((day) => {
    const dayNumber = dayNameToNumber[day.toLowerCase()]
    if (dayNumber === undefined) {
      throw new Error(`Invalid day: ${day}`)
    }
    return dayNumber
  })
  
  console.log('Input days:', schedule.days)
  console.log('Converted to numbers:', scheduleDays)
  
  console.log('Expected schedule entries:')
  scheduleDays.forEach((dayNumber) => {
    console.log(`  Day ${dayNumber} (${Object.keys(dayNameToNumber)[dayNumber]}): ${schedule.startTime} - ${schedule.endTime}`)
  })
}

testScheduleCreation()
