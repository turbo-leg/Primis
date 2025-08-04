import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCourseInstructorAssignments() {
  try {
    console.log('🔧 Fixing course instructor assignments...')

    // Get all courses
    const courses = await prisma.course.findMany({
      include: {
        instructorUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`📚 Found ${courses.length} courses to check`)

    let fixedCount = 0

    for (const course of courses) {
      let needsUpdate = false
      const updateData: any = {}

      // Case 1: instructorId is null but instructor field contains a user ID
      if (!course.instructorId && course.instructor) {
        // Check if instructor field contains a user ID (cuid format)
        const possibleUser = await prisma.user.findFirst({
          where: {
            id: course.instructor,
            role: 'INSTRUCTOR'
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        })

        if (possibleUser) {
          console.log(`  📝 Course "${course.title}": Moving instructor ID from instructor field to instructorId field`)
          updateData.instructorId = possibleUser.id
          updateData.instructor = possibleUser.name || possibleUser.email
          needsUpdate = true
        }
      }

      // Case 2: instructorId exists but instructor field is still a user ID
      if (course.instructorId && course.instructorUser) {
        if (course.instructor === course.instructorId) {
          console.log(`  📝 Course "${course.title}": Updating instructor display name`)
          updateData.instructor = course.instructorUser.name || course.instructorUser.email
          needsUpdate = true
        }
      }

      // Case 3: instructorId exists but instructor field is empty or incorrect
      if (course.instructorId && course.instructorUser && !course.instructor) {
        console.log(`  📝 Course "${course.title}": Setting instructor display name`)
        updateData.instructor = course.instructorUser.name || course.instructorUser.email
        needsUpdate = true
      }

      if (needsUpdate) {
        await prisma.course.update({
          where: { id: course.id },
          data: updateData
        })
        fixedCount++
        console.log(`    ✅ Fixed course: ${course.title}`)
      }
    }

    console.log(`🎉 Fixed ${fixedCount} courses out of ${courses.length} total courses`)

    // Now let's verify the fixes
    console.log('\n🔍 Verifying fixes...')
    const verificationCourses = await prisma.course.findMany({
      include: {
        instructorUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    for (const course of verificationCourses) {
      if (course.instructorId) {
        if (!course.instructorUser) {
          console.log(`  ⚠️  WARNING: Course "${course.title}" has instructorId "${course.instructorId}" but no matching user found`)
        } else {
          console.log(`  ✅ Course "${course.title}" -> Instructor: ${course.instructorUser.name} (ID: ${course.instructorId})`)
        }
      } else {
        console.log(`  ⚠️  Course "${course.title}" has no instructorId assigned`)
      }
    }

  } catch (error) {
    console.error('❌ Error fixing course instructor assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCourseInstructorAssignments()
