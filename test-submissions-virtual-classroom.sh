#!/bin/bash

# Test complete assignment and virtual classroom functionality
echo "🧪 Testing Submissions and Virtual Classroom APIs..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Step 1: Running database migration...${NC}"
npx prisma migrate dev --name add-submissions-virtual-classroom

echo -e "${BLUE}🔄 Step 2: Generating Prisma client...${NC}"
npx prisma generate

echo -e "${BLUE}🔄 Step 3: Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Step 4: Starting development server (background)...${NC}"
npm run dev &
DEV_SERVER_PID=$!

# Wait for server to start
sleep 10

echo -e "${BLUE}🔄 Step 5: Testing API endpoints...${NC}"

# Test virtual classroom API
echo -e "${YELLOW}Testing Virtual Classroom API...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/virtual-classroom/rooms)
echo "Virtual Classroom Rooms API: Status $RESPONSE"

# Test assignments API
echo -e "${YELLOW}Testing Assignments API...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/assignments)
echo "Assignments API: Status $RESPONSE"

# Test submissions API
echo -e "${YELLOW}Testing Submissions API...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/submissions)
echo "Submissions API: Status $RESPONSE"

# Test classroom sessions API
echo -e "${YELLOW}Testing Classroom Sessions API...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/classroom/sessions)
echo "Classroom Sessions API: Status $RESPONSE"

echo -e "${BLUE}🔄 Step 6: Stopping development server...${NC}"
kill $DEV_SERVER_PID

echo -e "${GREEN}✅ All tests completed!${NC}"

echo ""
echo -e "${BLUE}📖 API Endpoints Available:${NC}"
echo "   📚 Assignments:"
echo "     GET /api/assignments - Get assignments for user"
echo "     POST /api/assignments - Create new assignment (instructors)"
echo "     GET /api/assignments/[id] - Get specific assignment"
echo "     PUT /api/assignments/[id] - Update assignment"
echo "     DELETE /api/assignments/[id] - Delete assignment"
echo ""
echo "   📋 Submissions:"
echo "     GET /api/submissions - Get submissions"
echo "     POST /api/submissions - Submit assignment"
echo "     GET /api/submissions/[id] - Get specific submission"
echo "     PATCH /api/submissions/[id] - Update submission (grading)"
echo ""
echo "   🏫 Virtual Classroom:"
echo "     GET /api/virtual-classroom/rooms - Get virtual rooms"
echo "     POST /api/virtual-classroom/rooms - Join virtual room"
echo "     GET /api/virtual-classroom/rooms/[id] - Get room details"
echo "     POST /api/virtual-classroom/rooms/[id] - Room actions"
echo ""
echo "   📅 Classroom Sessions:"
echo "     GET /api/classroom/sessions - Get classroom sessions"
echo "     POST /api/classroom/sessions - Classroom actions"
echo ""
echo -e "${GREEN}🚀 Ready for submissions and virtual classroom functionality!${NC}"