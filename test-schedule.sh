#!/bin/bash

echo "🧪 Testing Database-Driven Schedule System"
echo "=========================================="

# Test 1: Check if courses have proper schedule data
echo ""
echo "📋 Test 1: Checking course schedule data..."
npx prisma studio &
STUDIO_PID=$!
sleep 2

echo "   - Open Prisma Studio to verify courses have:"
echo "     ✓ startDate field populated"
echo "     ✓ duration and durationUnit set" 
echo "     ✓ schedule field with format: 'Monday,Wednesday,Friday 09:00-10:30'"
echo "     ✓ location field populated"

# Test 2: Check enrollments
echo ""
echo "📋 Test 2: Checking user enrollments..."
echo "   - Verify users are enrolled in courses with ACTIVE status"

# Test 3: Check assignments have due dates
echo ""
echo "📋 Test 3: Checking assignment due dates..."
echo "   - Verify assignments have dueDate field populated"
echo "   - Due dates should be relative to course start dates"

# Test 4: Test API endpoint
echo ""
echo "📋 Test 4: Testing schedule API endpoint..."
echo "   - Start the development server: npm run dev"
echo "   - Login to the application"
echo "   - Navigate to /schedule"
echo "   - Check browser console for API responses"

echo ""
echo "🔧 Expected Schedule Format Examples:"
echo "   - 'Monday,Wednesday,Friday 09:00-10:30'"
echo "   - 'Tuesday,Thursday 11:00-12:30'"
echo "   - 'Monday,Wednesday 14:00-15:30'"

echo ""
echo "📅 Expected Calendar Features:"
echo "   ✓ Blue events for class sessions"
echo "   ✓ Red events for assignment due dates"
echo "   ✓ Proper time display and tooltips"
echo "   ✓ Only shows courses user is enrolled in"
echo "   ✓ Respects course duration and end dates"

# Kill Prisma Studio
kill $STUDIO_PID 2>/dev/null

echo ""
echo "🚀 Run 'npm run dev' and visit http://localhost:3000/schedule to test!"
echo "📊 Check the browser console for API debugging information."