import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create instructors
  const instructor1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@primiseducare.com',
      password: await bcrypt.hash('password123', 12),
      role: 'INSTRUCTOR',
      phone: '(555) 123-4567',
      address: '123 Education Lane, Learning City, LC 12345',
    },
  })

  const instructor2 = await prisma.user.create({
    data: {
      name: 'Michael Chen',
      email: 'michael.chen@primiseducare.com',
      password: await bcrypt.hash('password123', 12),
      role: 'INSTRUCTOR',
      phone: '(555) 234-5678',
    },
  })

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@primiseducare.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      phone: '(555) 000-0000',
    },
  })

  // Create sample students
  const student1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice.johnson@email.com',
      password: await bcrypt.hash('student123', 12),
      role: 'STUDENT',
      phone: '(555) 345-6789',
      dateOfBirth: new Date('2006-05-15'),
    },
  })

  const student2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob.smith@email.com',
      password: await bcrypt.hash('student123', 12),
      role: 'STUDENT',
      phone: '(555) 456-7890',
      dateOfBirth: new Date('2006-08-22'),
    },
  })

  // Create courses
  const satCourse = await prisma.course.create({
    data: {
      title: 'SAT Preparation',
      description: 'Comprehensive SAT prep covering all sections with proven strategies and practice tests.',
      instructor: 'Michael Chen',
      duration: 8,
      durationUnit: 'weeks',
      price: 799.00,
      level: 'INTERMEDIATE',
      capacity: 15,
      startDate: new Date('2025-01-15'),
      schedule: JSON.stringify({
        days: ['monday', 'wednesday', 'friday'],
        startTime: '15:00',
        endTime: '16:30',
        timezone: 'America/New_York'
      }),
    },
  })

  const essayWriting = await prisma.course.create({
    data: {
      title: 'Essay Writing Workshop',
      description: 'Develop strong writing skills for college-level essays and research papers.',
      instructor: 'Dr. Sarah Johnson',
      duration: 6,
      durationUnit: 'weeks',
      price: 599.00,
      level: 'BEGINNER',
      capacity: 12,
      startDate: new Date('2025-01-20'),
      schedule: JSON.stringify({
        days: ['tuesday', 'thursday'],
        startTime: '10:00',
        endTime: '11:30',
        timezone: 'America/New_York'
      }),
    },
  })

  // Create schedules
  await prisma.schedule.create({
    data: {
      courseId: satCourse.id,
      dayOfWeek: 6, // Saturday
      startTime: '09:00',
      endTime: '12:00',
      room: 'Room 101',
    },
  })

  await prisma.schedule.create({
    data: {
      courseId: essayWriting.id,
      dayOfWeek: 3, // Wednesday
      startTime: '17:00',
      endTime: '19:00',
      room: 'Room 205',
    },
  })

  // Create enrollments
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: satCourse.id,
      status: 'ACTIVE',
    },
  })

  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: essayWriting.id,
      status: 'ACTIVE',
    },
  })

  await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: satCourse.id,
      status: 'ACTIVE',
    },
  })

  // Create chat rooms
  const satChatRoom = await prisma.chatRoom.create({
    data: {
      name: 'SAT Preparation - Discussion',
      courseId: satCourse.id,
      isPublic: false,
    },
  })

  const essayWritingChatRoom = await prisma.chatRoom.create({
    data: {
      name: 'Essay Writing Workshop - Discussion',
      courseId: essayWriting.id,
      isPublic: false,
    },
  })

  const generalChatRoom = await prisma.chatRoom.create({
    data: {
      name: 'General Discussion',
      isPublic: true,
    },
  })

  // Create sample chat messages
  await prisma.chatMessage.create({
    data: {
      content: 'Welcome to the SAT Prep discussion room! Feel free to ask any questions.',
      userId: instructor2.id,
      chatRoomId: satChatRoom.id,
    },
  })

  await prisma.chatMessage.create({
    data: {
      content: 'Hi everyone! Looking forward to improving my SAT scores.',
      userId: student1.id,
      chatRoomId: satChatRoom.id,
    },
  })

  await prisma.chatMessage.create({
    data: {
      content: 'Welcome to the Essay Writing Workshop! We\'ll focus on developing strong writing techniques.',
      userId: instructor1.id,
      chatRoomId: essayWritingChatRoom.id,
    },
  })

  await prisma.chatMessage.create({
    data: {
      content: 'Looking forward to improving my college essays!',
      userId: student2.id,
      chatRoomId: essayWritingChatRoom.id,
    },
  })

  // Create sample documents
  console.log('📄 Creating sample documents...')
  
  await prisma.document.create({
    data: {
      title: 'SAT Practice Test 1',
      description: 'Official College Board SAT Practice Test with answer explanations',
      filename: 'sat-practice-test-1.pdf',
      fileUrl: '/uploads/documents/sat-practice-test-1.pdf',
      fileSize: 2500000,
      fileType: 'application/pdf',
      courseId: satCourse.id,
      uploadedById: instructor1.id,
      isPublic: false,
    },
  })

  await prisma.document.create({
    data: {
      title: 'Essay Writing Guide',
      description: 'Comprehensive guide to writing compelling college application essays',
      filename: 'essay-writing-guide.pdf',
      fileUrl: '/uploads/documents/essay-writing-guide.pdf',
      fileSize: 1200000,
      fileType: 'application/pdf',
      courseId: essayWriting.id,
      uploadedById: instructor1.id,
      isPublic: true,
    },
  })

  await prisma.document.create({
    data: {
      title: 'Math Formula Sheet',
      description: 'Essential formulas for SAT Math section',
      filename: 'math-formulas.pdf',
      fileUrl: '/uploads/documents/math-formulas.pdf',
      fileSize: 500000,
      fileType: 'application/pdf',
      courseId: satCourse.id,
      uploadedById: instructor1.id,
      isPublic: true,
    },
  })

  await prisma.document.create({
    data: {
      title: 'Public Study Guide',
      description: 'General study tips and strategies for all students',
      filename: 'general-study-guide.pdf',
      fileUrl: '/uploads/documents/general-study-guide.pdf',
      fileSize: 800000,
      fileType: 'application/pdf',
      uploadedById: instructor2.id,
      isPublic: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📚 Sample users created:')
  console.log('👨‍🏫 Instructor: sarah.johnson@primiseducare.com (password: password123)')
  console.log('👨‍🏫 Instructor: michael.chen@primiseducare.com (password: password123)')
  console.log('👨‍💼 Admin: admin@primiseducare.com (password: admin123)')
  console.log('👩‍🎓 Student: alice.johnson@email.com (password: student123)')
  console.log('👨‍🎓 Student: bob.smith@email.com (password: student123)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
