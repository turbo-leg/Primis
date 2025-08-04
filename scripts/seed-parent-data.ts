import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedParentData() {
  try {
    console.log('Adding parent user and linking to student...')

    // Create a parent user
    const parent = await prisma.user.upsert({
      where: { email: 'parent@example.com' },
      update: {},
      create: {
        email: 'parent@example.com',
        name: 'Jane Parent',
        role: 'PARENT',
        password: 'password123'
      }
    })

    console.log('Parent created:', parent)

    // Find an existing student or create one
    let student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })

    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student@example.com',
          name: 'John Student',
          role: 'STUDENT',
          password: 'password123'
        }
      })
    }

    // Link student to parent
    await prisma.user.update({
      where: { id: student.id },
      data: { parentId: parent.id }
    })

    console.log('Student linked to parent:', student)

    // Add some sample attendance records
    const course = await prisma.course.findFirst()
    if (course) {
      const today = new Date()
      const dates = [
        new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      ]

      for (const date of dates) {
        await prisma.attendance.upsert({
          where: {
            userId_courseId_date: {
              userId: student.id,
              courseId: course.id,
              date: date
            }
          },
          update: {},
          create: {
            userId: student.id,
            courseId: course.id,
            date: date,
            status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT'
          }
        })
      }

      console.log('Sample attendance records created')
    }

    console.log('✅ Parent data seeded successfully!')
  } catch (error) {
    console.error('Error seeding parent data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedParentData()
