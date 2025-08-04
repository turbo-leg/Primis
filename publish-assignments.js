const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function publishAssignments() {
  try {
    // Update all assignments to be published
    const result = await prisma.assignment.updateMany({
      where: {
        isPublished: false
      },
      data: {
        isPublished: true
      }
    })

    console.log(`Published ${result.count} assignments`)
    
    // List all assignments after update
    const assignments = await prisma.assignment.findMany({
      include: {
        course: {
          select: {
            title: true
          }
        }
      }
    })

    console.log('\nAll assignments:')
    assignments.forEach(a => {
      console.log(`- ${a.title} (Course: ${a.course.title}, Published: ${a.isPublished})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

publishAssignments()
