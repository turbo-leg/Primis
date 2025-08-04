// Test assignment creation and notification system
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAssignmentNotifications() {
  console.log('🧪 Testing assignment notification system...\n')
  
  try {
    // Get a course with enrolled students
    const courseWithEnrollments = await prisma.course.findFirst({
      where: {
        enrollments: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        enrollments: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!courseWithEnrollments) {
      console.log('❌ No courses with active enrollments found')
      return
    }

    console.log(`📚 Course: ${courseWithEnrollments.title}`)
    console.log(`👥 Enrolled students: ${courseWithEnrollments.enrollments.length}`)
    courseWithEnrollments.enrollments.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. ${enrollment.user.name} (${enrollment.user.email})`)
    })

    // Check existing notifications for these users before creating assignment
    const userIds = courseWithEnrollments.enrollments.map(e => e.userId)
    const existingNotifications = await prisma.notification.count({
      where: {
        userId: {
          in: userIds
        }
      }
    })

    console.log(`\n📬 Existing notifications for these users: ${existingNotifications}`)

    // Test the notification function directly
    const { notifyStudentsOfNewAssignment } = require('./src/lib/notifications.ts')
    
    const testDueDate = new Date()
    testDueDate.setDate(testDueDate.getDate() + 7) // Due in 7 days

    console.log('\n📨 Testing notification function...')
    const result = await notifyStudentsOfNewAssignment(
      courseWithEnrollments.id,
      'Test Assignment - Notification System',
      testDueDate
    )

    console.log(`✅ Notification function result: ${JSON.stringify(result)}`)

    // Check if notifications were created
    const newNotifications = await prisma.notification.findMany({
      where: {
        userId: {
          in: userIds
        },
        title: {
          contains: 'New Assignment'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`\n📬 New notifications created: ${newNotifications.length}`)
    newNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title} - ${notification.message}`)
    })

  } catch (error) {
    console.error('❌ Error testing notifications:', error)
  }
}

testAssignmentNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
