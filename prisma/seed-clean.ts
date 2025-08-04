import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  try {
    // Clear existing data in proper order to avoid foreign key constraints
    console.log('🧹 Cleaning existing data...')
    await prisma.attendance.deleteMany()
    await prisma.submission.deleteMany()
    await prisma.assignmentFile.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.announcement.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.chatRoom.deleteMany()
    await prisma.document.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.course.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create instructors
    console.log('👨‍🏫 Creating instructors...')
    const instructor1 = await prisma.user.create({
      data: {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@primiseducare.com',
        password: await bcrypt.hash('instructor123', 12),
        role: 'INSTRUCTOR',
        phone: '(555) 123-4567',
      },
    })

    const instructor2 = await prisma.user.create({
      data: {
        name: 'Michael Chen',
        email: 'michael.chen@primiseducare.com',
        password: await bcrypt.hash('instructor123', 12),
        role: 'INSTRUCTOR',
        phone: '(555) 234-5678',
      },
    })

    // Create admin user
    console.log('👑 Creating admin user...')
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
    console.log('🎓 Creating students...')
    const student1 = await prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice.johnson@email.com',
        password: await bcrypt.hash('student123', 12),
        role: 'STUDENT',
        phone: '(555) 345-6789',
      },
    })

    const student2 = await prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob.smith@email.com',
        password: await bcrypt.hash('student123', 12),
        role: 'STUDENT',
        phone: '(555) 456-7890',
      },
    })

    // Create courses
    console.log('📚 Creating courses...')
    const satCourse = await prisma.course.create({
      data: {
        title: 'SAT Preparation',
        description: 'Comprehensive SAT prep covering all sections with proven strategies and practice tests.',
        instructor: 'Michael Chen',
        instructorId: instructor2.id,
        duration: 8,
        durationUnit: 'weeks',
        price: 799.00,
        level: 'INTERMEDIATE',
        capacity: 15,
        startDate: new Date('2025-08-05'), // Start next week
        timezone: 'Asia/Ulaanbaatar'
      },
    })

    const essayWriting = await prisma.course.create({
      data: {
        title: 'Essay Writing Workshop',
        description: 'Develop strong writing skills for college-level essays and research papers.',
        instructor: 'Dr. Sarah Johnson',
        instructorId: instructor1.id,
        duration: 6,
        durationUnit: 'weeks',
        price: 599.00,
        level: 'BEGINNER',
        capacity: 12,
        startDate: new Date('2025-08-12'), // Start in about a week
        timezone: 'Asia/Ulaanbaatar'
      },
    })

    const mathCourse = await prisma.course.create({
      data: {
        title: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts including calculus, linear algebra, and statistics.',
        instructor: 'Dr. Sarah Johnson',
        instructorId: instructor1.id,
        duration: 12,
        durationUnit: 'weeks',
        price: 999.00,
        level: 'ADVANCED',
        capacity: 20,
        startDate: new Date('2025-08-01'), // Started recently
        timezone: 'Asia/Ulaanbaatar'
      },
    })

    // Create schedules for courses
    console.log('📅 Creating course schedules...')
    
    // SAT Course: Monday, Wednesday, Friday 3:00-4:30 PM
    await prisma.schedule.createMany({
      data: [
        {
          courseId: satCourse.id,
          dayOfWeek: 1, // Monday
          startTime: '15:00',
          endTime: '16:30',
          isActive: true
        },
        {
          courseId: satCourse.id,
          dayOfWeek: 3, // Wednesday
          startTime: '15:00',
          endTime: '16:30',
          isActive: true
        },
        {
          courseId: satCourse.id,
          dayOfWeek: 5, // Friday
          startTime: '15:00',
          endTime: '16:30',
          isActive: true
        }
      ]
    })

    // Essay Writing: Tuesday, Thursday 10:00-11:30 AM
    await prisma.schedule.createMany({
      data: [
        {
          courseId: essayWriting.id,
          dayOfWeek: 2, // Tuesday
          startTime: '10:00',
          endTime: '11:30',
          isActive: true
        },
        {
          courseId: essayWriting.id,
          dayOfWeek: 4, // Thursday
          startTime: '10:00',
          endTime: '11:30',
          isActive: true
        }
      ]
    })

    // Math Course: Monday, Wednesday 9:00-10:30 AM
    await prisma.schedule.createMany({
      data: [
        {
          courseId: mathCourse.id,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '10:30',
          isActive: true
        },
        {
          courseId: mathCourse.id,
          dayOfWeek: 3, // Wednesday
          startTime: '09:00',
          endTime: '10:30',
          isActive: true
        }
      ]
    })

    // Create enrollments
    console.log('📝 Creating enrollments...')
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

    await prisma.enrollment.create({
      data: {
        userId: student2.id,
        courseId: mathCourse.id,
        status: 'ACTIVE',
      },
    })

    // Create assignments
    console.log('📝 Creating assignments...')
    const satAssignment = await prisma.assignment.create({
      data: {
        title: 'SAT Practice Test Analysis',
        description: 'Complete a full-length SAT practice test and submit your analysis of strengths and weaknesses.',
        courseId: satCourse.id,
        instructorId: instructor2.id,
        dueDate: new Date('2025-08-15T23:59:00'),
        maxPoints: 100,
        isPublished: true,
      },
    })

    const essayAssignment = await prisma.assignment.create({
      data: {
        title: 'Personal Statement Draft',
        description: 'Write a 500-word personal statement for college applications.',
        courseId: essayWriting.id,
        instructorId: instructor1.id,
        dueDate: new Date('2025-08-20T23:59:00'),
        maxPoints: 75,
        isPublished: true,
      },
    })

    const mathAssignment = await prisma.assignment.create({
      data: {
        title: 'Calculus Problem Set',
        description: 'Complete problems 1-20 from Chapter 5 on derivatives and applications.',
        courseId: mathCourse.id,
        instructorId: instructor1.id,
        dueDate: new Date('2025-08-10T23:59:00'),
        maxPoints: 50,
        isPublished: true,
      },
    })

    // Create sample submissions
    console.log('📤 Creating sample submissions...')
    await prisma.submission.create({
      data: {
        assignmentId: satAssignment.id,
        studentId: student1.id,
        content: 'I have completed the SAT practice test. My analysis is attached.',
        status: 'SUBMITTED',
      },
    })

    await prisma.submission.create({
      data: {
        assignmentId: essayAssignment.id,
        studentId: student1.id,
        content: 'Here is my college application essay draft about overcoming challenges.',
        grade: 68,
        feedback: 'Great essay! Strong personal voice. Consider expanding on the conclusion.',
        status: 'GRADED',
        gradedAt: new Date(),
      },
    })

    // Create chat rooms
    console.log('💬 Creating chat rooms...')
    const satChatRoom = await prisma.chatRoom.create({
      data: {
        name: 'SAT Preparation - General Discussion',
        courseId: satCourse.id,
        isPublic: false,
      },
    })

    const essayWritingChatRoom = await prisma.chatRoom.create({
      data: {
        name: 'Essay Writing Workshop - General Discussion',
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

    // Create some sample chat messages
    console.log('💬 Creating sample chat messages...')
    await prisma.chatMessage.create({
      data: {
        content: 'Welcome to the SAT Preparation course! Feel free to ask any questions here.',
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

    // Create announcements
    console.log('📢 Creating sample announcements...')
    await prisma.announcement.create({
      data: {
        title: 'Welcome to SAT Preparation!',
        content: `Welcome everyone to ${satCourse.title}! I'm excited to have you in this course. Please make sure to review the syllabus and check for upcoming assignments.`,
        priority: 'HIGH',
        isImportant: true,
        publishedAt: new Date(),
        isDraft: false,
        courseId: satCourse.id,
        authorId: instructor2.id,
      }
    })

    await prisma.announcement.create({
      data: {
        title: 'Welcome to Essay Writing Workshop!',
        content: 'Welcome to the Essay Writing Workshop! We will focus on crafting compelling personal essays for college applications.',
        priority: 'NORMAL',
        isImportant: false,
        publishedAt: new Date(),
        isDraft: false,
        courseId: essayWriting.id,
        authorId: instructor1.id,
      }
    })

    console.log('✅ Database seeded successfully!')
    console.log(`   👥 Created ${await prisma.user.count()} users`)
    console.log(`   📚 Created ${await prisma.course.count()} courses`)
    console.log(`   📅 Created ${await prisma.schedule.count()} schedule entries`)
    console.log(`   📝 Created ${await prisma.enrollment.count()} enrollments`)
    console.log(`   📋 Created ${await prisma.assignment.count()} assignments`)
    console.log(`   📤 Created ${await prisma.submission.count()} submissions`)
    console.log(`   💬 Created ${await prisma.chatRoom.count()} chat rooms`)
    console.log(`   📢 Created ${await prisma.announcement.count()} announcements`)

    console.log('\n📚 Sample users created:')
    console.log('👨‍🏫 Instructor: sarah.johnson@primiseducare.com')
    console.log('👨‍🏫 Instructor: michael.chen@primiseducare.com')
    console.log('👨‍💼 Admin: admin@primiseducare.com')
    console.log('👩‍🎓 Student: alice.johnson@email.com')
    console.log('👨‍🎓 Student: bob.smith@email.com')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
