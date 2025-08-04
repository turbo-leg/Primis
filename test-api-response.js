// Simple test to check the actual API response
async function testScheduleAPI() {
  try {
    console.log('🔍 Testing actual schedule API response...\n')
    
    const response = await fetch('http://localhost:3000/api/schedule?startDate=2025-08-01T00:00:00.000Z&endDate=2025-08-31T23:59:59.999Z', {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Error response:', errorText)
      return
    }
    
    const events = await response.json()
    console.log(`📅 Received ${events.length} events from API\n`)
    
    // Filter dsaDSA course events
    const dsaDSAEvents = events.filter(event => event.courseTitle === 'dsaDSA')
    console.log(`🎯 dsaDSA course events: ${dsaDSAEvents.length}\n`)
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    dsaDSAEvents.forEach((event, index) => {
      const eventDate = new Date(event.date + 'T12:00:00') // Add time to avoid timezone issues
      const dayOfWeek = eventDate.getDay()
      
      console.log(`Event ${index + 1}:`)
      console.log(`  Date: ${event.date}`)
      console.log(`  Time: ${event.startTime} - ${event.endTime}`)
      console.log(`  Course: ${event.courseTitle}`)
      console.log(`  Parsed as: ${eventDate.toDateString()}`)
      console.log(`  Day of week: ${dayOfWeek} (${dayNames[dayOfWeek]})`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

testScheduleAPI()
