import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCourseInstructors() {
  try {
    console.log('Fixing course instructor relationships...')
    
    // Get all courses that have instructor string but no instructorId
    const coursesNeedingFix = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: null },
          { instructorId: '' }
        ]
      }
    })
    
    console.log(`Found ${coursesNeedingFix.length} courses needing instructor fix`)
    
    for (const course of coursesNeedingFix) {
      console.log(`\nProcessing course: ${course.title}`)
      console.log(`Current instructor: ${course.instructor}`)
      console.log(`Current instructorId: ${course.instructorId}`)
      
      if (course.instructor) {
        // Try to find user by email first (most likely)
        let user = await prisma.user.findFirst({
          where: {
            email: course.instructor
          }
        })
        
        // If not found by email, try by name
        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              name: {
                contains: course.instructor,
                mode: 'insensitive'
              }
            }
          })
        }
        
        if (user) {
          console.log(`Found user: ${user.name} (${user.email}) - ${user.id}`)
          
          // Update the course with the correct instructorId
          await prisma.course.update({
            where: { id: course.id },
            data: {
              instructorId: user.id,
              instructor: user.name || user.email // Standardize the instructor name
            }
          })
          
          console.log(`✓ Updated course ${course.title} with instructorId: ${user.id}`)
        } else {
          console.log(`⚠️  No user found for instructor: ${course.instructor}`)
          
          // Create a new instructor user if needed
          const instructorEmail = course.instructor.includes('@') 
            ? course.instructor 
            : `${course.instructor.toLowerCase().replace(/\s+/g, '.')}@primiseducare.com`
          
          const newUser = await prisma.user.create({
            data: {
              name: course.instructor,
              email: instructorEmail,
              role: 'INSTRUCTOR'
            }
          })
          
          await prisma.course.update({
            where: { id: course.id },
            data: {
              instructorId: newUser.id,
              instructor: newUser.name || newUser.email
            }
          })
          
          console.log(`✓ Created new instructor user and updated course: ${newUser.email}`)
        }
      } else {
        console.log(`⚠️  Course has no instructor name, skipping: ${course.title}`)
      }
    }
    
    console.log('\n✓ Course instructor fix completed!')
    
  } catch (error) {
    console.error('Error fixing course instructors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCourseInstructors()
