import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAssignmentInstructors() {
  console.log('Starting to fix assignment instructors...')
  
  try {
    // Get all assignments that don't have instructorId set
    const assignments = await prisma.assignment.findMany({
      where: {
        instructorId: null
      },
      include: {
        course: {
          select: {
            instructorId: true,
            instructor: true
          }
        }
      }
    })

    console.log(`Found ${assignments.length} assignments without instructorId`)

    for (const assignment of assignments) {
      if (assignment.course.instructorId) {
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { instructorId: assignment.course.instructorId }
        })
        console.log(`Updated assignment ${assignment.id} with instructor ${assignment.course.instructorId}`)
      } else {
        console.log(`Warning: Assignment ${assignment.id} has course without instructorId`)
      }
    }

    console.log('Finished fixing assignment instructors')
  } catch (error) {
    console.error('Error fixing assignment instructors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAssignmentInstructors()
