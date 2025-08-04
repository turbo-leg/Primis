import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDatabase() {
  console.log('Starting database seeding...')

  try {
    // First, let's ensure we have some users with different roles
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@primiseducare.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@primiseducare.com',
        role: 'ADMIN'
      }
    })

    const instructorUser = await prisma.user.upsert({
      where: { email: 'instructor@primiseducare.com' },
      update: {},
      create: {
        name: 'John Smith',
        email: 'instructor@primiseducare.com',
        role: 'INSTRUCTOR'
      }
    })

    const studentUser = await prisma.user.upsert({
      where: { email: 'student@primiseducare.com' },
      update: {},
      create: {
        name: 'Jane Doe',
        email: 'student@primiseducare.com',
        role: 'STUDENT'
      }
    })

    console.log('✓ Users created/updated')

    // Update existing courses to have proper instructorId
    const courses = await prisma.course.findMany()
    for (const course of courses) {
      if (!course.instructorId) {
        await prisma.course.update({
          where: { id: course.id },
          data: { instructorId: instructorUser.id }
        })
      }
    }

    // Create sample courses if none exist
    const courseCount = await prisma.course.count()
    if (courseCount === 0) {
      const sampleCourses = [
        {
          title: 'SAT Preparation',
          description: 'Comprehensive SAT preparation course covering all sections',
          instructor: instructorUser.name || 'John Smith',
          instructorId: instructorUser.id,
          duration: 12,
          durationUnit: 'weeks',
          price: 599.99,
          level: 'Intermediate',
          capacity: 20,
          startDate: new Date('2025-09-01'),
          schedule: JSON.stringify({
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '16:00-17:30'
          }),
          timezone: 'America/New_York'
        },
        {
          title: 'ACT Preparation',
          description: 'Complete ACT test preparation with practice tests',
          instructor: instructorUser.name || 'John Smith',
          instructorId: instructorUser.id,
          duration: 10,
          durationUnit: 'weeks',
          price: 549.99,
          level: 'Intermediate',
          capacity: 15,
          startDate: new Date('2025-09-15'),
          schedule: JSON.stringify({
            days: ['Tuesday', 'Thursday'],
            time: '17:00-18:30'
          }),
          timezone: 'America/New_York'
        }
      ]

      for (const courseData of sampleCourses) {
        await prisma.course.create({ data: courseData })
      }
      console.log('✓ Sample courses created')
    }

    // Get courses for creating schedules and enrollments
    const allCourses = await prisma.course.findMany()

    // Create schedules for courses
    for (const course of allCourses) {
      const scheduleCount = await prisma.schedule.count({
        where: { courseId: course.id }
      })
      
      if (scheduleCount === 0) {
        // Default schedule since course.schedule field no longer exists
        const scheduleData = {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '16:00-17:30'
        }

        const dayMapping: { [key: string]: number } = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        }

        const [startTime, endTime] = scheduleData.time.split('-')

        for (const day of scheduleData.days) {
          await prisma.schedule.create({
            data: {
              courseId: course.id,
              dayOfWeek: dayMapping[day] || 1,
              startTime: startTime,
              endTime: endTime,
              isActive: true
            }
          })
        }
      }
    }
    console.log('✓ Course schedules created')

    // Create sample enrollments
    const enrollmentExists = await prisma.enrollment.findFirst({
      where: { userId: studentUser.id }
    })

    if (!enrollmentExists && allCourses.length > 0) {
      await prisma.enrollment.create({
        data: {
          userId: studentUser.id,
          courseId: allCourses[0].id,
          status: 'ACTIVE'
        }
      })
      console.log('✓ Sample enrollment created')
    }

    // Create sample assignments
    for (const course of allCourses) {
      const assignmentCount = await prisma.assignment.count({
        where: { courseId: course.id }
      })

      if (assignmentCount === 0) {
        await prisma.assignment.create({
          data: {
            title: 'Practice Test 1',
            description: 'Complete the first practice test and submit your answers',
            courseId: course.id,
            instructorId: course.instructorId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            maxPoints: 100,
            isPublished: true
          }
        })
      }
    }
    console.log('✓ Sample assignments created')

    // Create sample attendance records
    const attendanceCount = await prisma.attendance.count()
    if (attendanceCount === 0 && allCourses.length > 0) {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      for (let i = 0; i < 5; i++) {
        const date = new Date(lastWeek.getTime() + i * 24 * 60 * 60 * 1000)
        await prisma.attendance.create({
          data: {
            userId: studentUser.id,
            courseId: allCourses[0].id,
            date: date,
            status: i < 4 ? 'PRESENT' : 'ABSENT' // 4 present, 1 absent
          }
        })
      }
      console.log('✓ Sample attendance records created')
    }

    // Create sample notifications
    const notificationCount = await prisma.notification.count()
    if (notificationCount === 0) {
      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          type: 'ASSIGNMENT_CREATED',
          title: 'New Assignment Available',
          message: 'A new practice test has been assigned to your SAT Preparation course.',
          isRead: false
        }
      })

      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          type: 'COURSE_ANNOUNCEMENT',
          title: 'Welcome to SAT Prep!',
          message: 'Welcome to your SAT Preparation course. Please review the syllabus and schedule.',
          isRead: true
        }
      })
      console.log('✓ Sample notifications created')
    }

    console.log('✓ Database seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
