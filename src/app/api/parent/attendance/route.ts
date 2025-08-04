import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentMongoliaTime } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user is a parent
    if (session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })
    }

    // Verify the child belongs to this parent (using raw query)
    const childResult = await prisma.$queryRaw`
      SELECT id, name, email, role FROM users 
      WHERE id = ${childId} AND "parentId" = ${session.user.id} AND role = 'STUDENT'
    ` as any[]

    if (!childResult || childResult.length === 0) {
      return NextResponse.json({ error: 'Child not found or not authorized' }, { status: 404 })
    }

    const child = childResult[0]

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate + 'T23:59:59')
    }

    // Get attendance records for the child
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: childId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructor: true
          }
        },
        schedule: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate attendance statistics
    const totalClasses = attendanceRecords.length
    const presentCount = attendanceRecords.filter(record => record.status === 'PRESENT').length
    const absentCount = attendanceRecords.filter(record => record.status === 'ABSENT').length
    const lateCount = attendanceRecords.filter(record => record.status === 'LATE').length
    const excusedCount = attendanceRecords.filter(record => record.status === 'EXCUSED').length

    const attendanceRate = totalClasses > 0 ? ((presentCount + lateCount) / totalClasses) * 100 : 0

    // Format the response
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      notes: record.notes,
      course: {
        id: record.course.id,
        title: record.course.title,
        instructor: record.course.instructor
      },
      schedule: record.schedule ? {
        dayOfWeek: record.schedule.dayOfWeek,
        startTime: record.schedule.startTime,
        endTime: record.schedule.endTime
      } : null
    }))

    const response = {
      child: {
        id: child.id,
        name: child.name,
        email: child.email
      },
      attendance: {
        records: formattedRecords,
        statistics: {
          totalClasses,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching child attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 })
  }
}
