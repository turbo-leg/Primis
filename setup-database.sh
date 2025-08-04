#!/bin/bash

echo "🔄 Setting up database and running seed..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Step 1: Generating Prisma client...${NC}"
npx prisma generate

echo -e "${BLUE}🔄 Step 2: Pushing database schema...${NC}"
npx prisma db push --force-reset

echo -e "${BLUE}🔄 Step 3: Running database seed...${NC}"
npx prisma db seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
    echo -e "${BLUE}📊 You can view your database with:${NC} npx prisma studio"
    echo ""
    echo -e "${GREEN}🎉 Ready to test the application!${NC}"
    echo -e "${BLUE}📖 Test users:${NC}"
    echo "   👨‍🏫 Instructor: sarah.johnson@primiseducare.com (password: password123)"
    echo "   👨‍🏫 Instructor: michael.chen@primiseducare.com (password: password123)"
    echo "   👨‍💼 Admin: admin@primiseducare.com (password: admin123)"
    echo "   👩‍🎓 Student: alice.johnson@email.com (password: student123)"
    echo "   👨‍🎓 Student: bob.smith@email.com (password: student123)"
else
    echo -e "${RED}❌ Database setup failed!${NC}"
    exit 1
fi