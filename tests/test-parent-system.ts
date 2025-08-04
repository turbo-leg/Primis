import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testParentSystem() {
  try {
    console.log('🧪 Testing Parent System...\n')

    // 1. Check if parent exists
    const parent = await prisma.user.findUnique({
      where: { email: 'parent@example.com' }
    })

    if (!parent) {
      console.log('❌ Parent user not found')
      return
    }

    console.log('✅ Parent user found:', parent.name, '(', parent.email, ')')

    // 2. Check if children are linked
    const children = await prisma.$queryRaw`
      SELECT id, name, email FROM users WHERE "parentId" = ${parent.id} AND role = 'STUDENT'
    ` as any[]

    console.log('👶 Children linked to parent:', children.length)
    children.forEach((child: any) => {
      console.log('  -', child.name, '(', child.email, ')')
    })

    if (children.length === 0) {
      console.log('⚠️  No children linked to parent. Run the seed script first.')
      return
    }

    // 3. Check attendance records
    const childId = children[0].id
    const attendanceCount = await prisma.attendance.count({
      where: { userId: childId }
    })

    console.log('📅 Attendance records for', children[0].name + ':', attendanceCount)

    // 4. Check submissions/grades
    const submissionCount = await prisma.submission.count({
      where: { studentId: childId }
    })

    console.log('📝 Submissions for', children[0].name + ':', submissionCount)

    // 5. Check enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { userId: childId, status: 'ACTIVE' }
    })

    console.log('📚 Active enrollments for', children[0].name + ':', enrollmentCount)

    console.log('\n🎉 Parent system test completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Login with: parent@example.com / password123')
    console.log('2. Visit: http://localhost:3000/parent')
    console.log('3. View your child\'s attendance and grades')

  } catch (error) {
    console.error('❌ Error testing parent system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testParentSystem()
