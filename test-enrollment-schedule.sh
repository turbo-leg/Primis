#!/bin/bash

# Test enrollment and schedule refresh flow
echo "🧪 Testing enrollment and schedule refresh flow..."

# First, get the current user's schedule before enrollment
echo "📅 Checking schedule before enrollment..."
curl -s "http://localhost:3000/api/schedule" \
  -H "Cookie: next-auth.session-token=test" \
  | jq '.[] | select(.isEnrolled == true) | .courseTitle' || echo "No enrolled courses found"

echo "📚 Getting available courses..."
curl -s "http://localhost:3000/api/courses" \
  -H "Cookie: next-auth.session-token=test" \
  | jq '.[0] | {id, title}' || echo "No courses found"

# Note: This is a basic test script. In a real test, we would:
# 1. Log in as a test user
# 2. Get their current enrollments
# 3. Enroll in a new course
# 4. Check that the course appears in their schedule immediately

echo "✅ Manual testing required:"
echo "1. Log in as a student (email: student@test.com, password: password123)"
echo "2. Go to /courses and enroll in a course"
echo "3. Navigate to /dashboard/schedule"
echo "4. Verify the enrolled course appears immediately"
echo "5. Check that the refresh button works"
echo "6. Verify auto-refresh every 30 seconds"
