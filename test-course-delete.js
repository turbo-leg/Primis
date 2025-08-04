#!/usr/bin/env node

/**
 * Test script for course deletion API
 * Run with: node test-course-delete.js
 */

const BASE_URL = 'http://localhost:3000'

async function testCourseDelete() {
  console.log('🧪 Testing Course Delete API...\n')

  try {
    // First, let's list courses to see what's available
    console.log('1. Fetching available courses...')
    const coursesResponse = await fetch(`${BASE_URL}/api/admin/courses/list`)
    
    if (!coursesResponse.ok) {
      console.log('❌ Could not fetch courses')
      console.log('Status:', coursesResponse.status)
      const error = await coursesResponse.text()
      console.log('Error:', error)
      return
    }

    const courses = await coursesResponse.json()
    console.log(`✅ Found ${courses.length} courses`)
    
    if (courses.length === 0) {
      console.log('ℹ️ No courses to delete')
      return
    }

    // Try to delete the first course
    const courseToDelete = courses[0]
    console.log(`\n2. Attempting to delete course: ${courseToDelete.title} (${courseToDelete.id})`)

    // First try without force (should show warning if there are enrollments)
    const deleteResponse1 = await fetch(`${BASE_URL}/api/admin/courses/${courseToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const deleteResult1 = await deleteResponse1.json()
    console.log('Status:', deleteResponse1.status)
    console.log('Response:', JSON.stringify(deleteResult1, null, 2))

    if (deleteResponse1.status === 400 && deleteResult1.canForceDelete) {
      console.log('\n3. Course has enrollments, trying force delete...')
      
      const deleteResponse2 = await fetch(`${BASE_URL}/api/admin/courses/${courseToDelete.id}?force=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const deleteResult2 = await deleteResponse2.json()
      console.log('Force delete status:', deleteResponse2.status)
      console.log('Force delete response:', JSON.stringify(deleteResult2, null, 2))

      if (deleteResponse2.ok) {
        console.log('✅ Course deleted successfully with force option')
      } else {
        console.log('❌ Force delete failed')
      }
    } else if (deleteResponse1.ok) {
      console.log('✅ Course deleted successfully')
    } else {
      console.log('❌ Delete failed')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testCourseDelete()
