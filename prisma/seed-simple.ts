import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

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
      instructor: 'Michael Chen',
      instructorId: instructor2.id,
      duration: 8,
      durationUnit: 'weeks',
      price: 799.00,
      level: 'INTERMEDIATE',
      capacity: 15,
      startDate: new Date('2025-01-15'),
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
      startDate: new Date('2025-01-20'),
    },
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

  // Create assignments
  console.log('📝 Creating assignments...')
  const satAssignment = await prisma.assignment.create({
    data: {
      title: 'SAT Practice Test Analysis',
      description: 'Complete a full-length SAT practice test and submit your analysis of strengths and weaknesses.',
      courseId: satCourse.id,
      dueDate: new Date('2025-02-01'),
      maxPoints: 100,
      isPublished: true,
    },
  })

  const essayAssignment = await prisma.assignment.create({
    data: {
      title: 'Personal Essay Draft',
      description: 'Write a 500-word personal essay for college applications.',
      courseId: essayWriting.id,
      dueDate: new Date('2025-02-15'),
      maxPoints: 100,
      isPublished: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created:`)
  console.log(`- ${await prisma.user.count()} users`)
  console.log(`- ${await prisma.course.count()} courses`)
  console.log(`- ${await prisma.enrollment.count()} enrollments`)
  console.log(`- ${await prisma.assignment.count()} assignments`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
