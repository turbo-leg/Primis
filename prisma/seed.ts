import { PrismaClient } from '@prisma/client'

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
        role: 'INSTRUCTOR',
        phone: '(555) 123-4567',
      },
    })

    const instructor2 = await prisma.user.create({
      data: {
        name: 'Michael Chen',
        email: 'michael.chen@primiseducare.com',
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
        role: 'STUDENT',
        phone: '(555) 345-6789',
      },
    })

    const student2 = await prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob.smith@email.com',
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
        instructor: instructor2.name || 'Michael Chen',
        instructorId: instructor2.id,
        duration: 8,
        durationUnit: 'weeks',
        price: 799.00,
        level: 'INTERMEDIATE',
        capacity: 15,
        startDate: new Date('2025-01-15'),
        timezone: 'America/New_York'
      },
    })

    const essayWriting = await prisma.course.create({
      data: {
        title: 'Essay Writing Workshop',
        description: 'Develop strong writing skills for college-level essays and research papers.',
        instructor: instructor1.name || 'Dr. Sarah Johnson',
        instructorId: instructor1.id,
        duration: 6,
        durationUnit: 'weeks',
        price: 599.00,
        level: 'BEGINNER',
        capacity: 12,
        startDate: new Date('2025-01-20'),
        timezone: 'America/New_York'
      },
    })

    const mathCourse = await prisma.course.create({
      data: {
        title: 'Advanced Mathematics',
        description: 'Advanced mathematical concepts including calculus, linear algebra, and statistics.',
        instructor: instructor1.name || 'Dr. Sarah Johnson',
        instructorId: instructor1.id,
        duration: 12,
        durationUnit: 'weeks',
        price: 999.00,
        level: 'ADVANCED',
        capacity: 20,
        startDate: new Date('2025-01-10'),
        timezone: 'America/New_York'
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
        dueDate: new Date('2025-02-01T23:59:00'),
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
        dueDate: new Date('2025-02-15T23:59:00'),
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
        dueDate: new Date('2025-01-25T23:59:00'),
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

    // Create chat rooms for courses
    console.log('💬 Creating chat rooms...')
    await prisma.chatRoom.create({
      data: {
        name: `${satCourse.title} - Discussion`,
        courseId: satCourse.id,
        isPublic: false
      }
    })

    await prisma.chatRoom.create({
      data: {
        name: `${essayWriting.title} - Discussion`,
        courseId: essayWriting.id,
        isPublic: false
      }
    })

    await prisma.chatRoom.create({
      data: {
        name: `${mathCourse.title} - Discussion`,
        courseId: mathCourse.id,
        isPublic: false
      }
    })

    await prisma.chatRoom.create({
      data: {
        name: 'General Discussion',
        isPublic: true
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

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
