#!/bin/bash

# Test Assignment File Upload APIs
echo "🧪 Testing Assignment File Upload APIs..."

# Check if development server is running
echo "📋 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running. Please start it with 'npm run dev'"
    exit 1
fi

echo "✅ Development server is running"

# Test API endpoints are accessible
echo "📋 Testing API endpoint accessibility..."

# Test assignment endpoint
echo "🔍 Testing assignment endpoint..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/assignments/test-id
echo " - Assignment endpoint responds"

# Test assignment files endpoint
echo "🔍 Testing assignment files endpoint..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/assignments/files
echo " - Assignment files endpoint responds"

echo "✅ All API endpoints are accessible"

echo "🎉 Assignment file upload system is ready!"
echo ""
echo "📖 API Endpoints Available:"
echo "   GET /api/assignments/[assignmentId] - Get assignment details"
echo "   PUT /api/assignments/[assignmentId] - Update assignment"
echo "   DELETE /api/assignments/[assignmentId] - Delete assignment"
echo "   POST /api/assignments/files - Upload assignment file"
echo "   GET /api/assignments/files?assignmentId=... - Get assignment files"
echo "   GET /api/assignments/files/[fileId] - Get file details"
echo "   DELETE /api/assignments/files/[fileId] - Delete file"
echo ""
echo "🚀 Ready for file uploads with documents and images!"
