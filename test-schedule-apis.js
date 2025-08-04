#!/usr/bin/env node

// Test API endpoints to debug schedule issues
const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3001'

async function testScheduleAPIs() {
  console.log('=== Testing Schedule APIs ===')
  
  try {
    // Test schedule events API
    console.log('\n1. Testing schedule events API...')
    const currentTime = new Date()
    const startDate = new Date(currentTime)
    startDate.setDate(startDate.getDate() - 30)
    const endDate = new Date(currentTime)
    endDate.setDate(endDate.getDate() + 60)
    
    const scheduleResponse = await fetch(`${BASE_URL}/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
    if (scheduleResponse.ok) {
      const scheduleData = await scheduleResponse.json()
      console.log('Schedule events found:', scheduleData.length)
      scheduleData.forEach((event, index) => {
        console.log(`Event ${index + 1}: ${event.title} on ${event.date} (${event.startTime}-${event.endTime})`)
      })
    } else {
      console.log('Schedule API error:', scheduleResponse.status, await scheduleResponse.text())
    }
    
    // Test admin schedules API
    console.log('\n2. Testing admin schedules API...')
    const adminSchedulesResponse = await fetch(`${BASE_URL}/api/admin/schedules`)
    if (adminSchedulesResponse.ok) {
      const adminSchedules = await adminSchedulesResponse.json()
      console.log('Admin schedules found:', adminSchedules.length)
      adminSchedules.forEach((schedule, index) => {
        console.log(`Schedule ${index + 1}: Course ${schedule.courseId} on ${schedule.dayOfWeek} (${schedule.startTime}-${schedule.endTime})`)
      })
    } else {
      console.log('Admin schedules API error:', adminSchedulesResponse.status, await adminSchedulesResponse.text())
    }
    
    // Test courses API
    console.log('\n3. Testing courses API...')
    const coursesResponse = await fetch(`${BASE_URL}/api/admin/courses`)
    if (coursesResponse.ok) {
      const courses = await coursesResponse.json()
      console.log('Courses found:', courses.length)
      courses.forEach((course, index) => {
        console.log(`Course ${index + 1}: ${course.title}`)
        if (course.schedules && course.schedules.length > 0) {
          course.schedules.forEach(schedule => {
            console.log(`  - ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`)
          })
        } else {
          console.log('  - No schedules')
        }
      })
    } else {
      console.log('Courses API error:', coursesResponse.status, await coursesResponse.text())
    }
    
  } catch (error) {
    console.error('Error testing APIs:', error.message)
  }
}

testScheduleAPIs()
