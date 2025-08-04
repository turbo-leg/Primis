import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentMongoliaTime } from '@/lib/timezone'

// Email service (you'll need to configure this with your email provider)
// For now, we'll simulate email sending
const sendEmail = async (to: string, subject: string, html: string) => {
  // TODO: Implement actual email sending using services like:
  // - Nodemailer with Gmail/SMTP
  // - SendGrid
  // - AWS SES
  // - Resend
  
  console.log('Sending email to:', to)
  console.log('Subject:', subject)
  console.log('HTML content:', html)
  
  // For now, return success
  return { success: true, messageId: 'simulated-' + Date.now() }
}

// Type definitions for report data
interface AttendanceRecord {
  date: string;
  course: string;
  instructor: string;
  status: string;
  notes?: string | null;
}

interface GradeSubmission {
  assignment: string;
  course: string;
  maxPoints: number | null;
  grade: number | null;
  submittedAt?: string;
  feedback?: string;
}

interface ReportData {
  child: { id: string; name: string; email: string };
  weekPeriod: { start: string; end: string };
  attendance: {
    records: AttendanceRecord[];
    statistics: {
      totalClasses: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      attendanceRate: number;
    };
  };
  grades: {
    submissions: GradeSubmission[];
    statistics: {
      totalAssignments: number;
      gradedAssignments: number;
      totalPoints: number;
      earnedPoints: number;
      averageGrade: number;
    };
  };
}

// Generate weekly report for a child
const generateWeeklyReport = async (parentId: string, childId: string, weekStart: Date, weekEnd: Date): Promise<ReportData> => {
  // Get child info
  const child = await prisma.$queryRaw`
    SELECT id, name, email FROM users WHERE id = ${childId} AND "parentId" = ${parentId} AND role = 'STUDENT'
  ` as any[]

  if (!child || child.length === 0) {
    throw new Error('Child not found')
  }

  // Get attendance for the week
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: childId,
      date: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    include: {
      course: {
        select: {
          title: true,
          instructor: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Get grades/submissions for the week
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: childId,
      submittedAt: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    include: {
      assignment: {
        select: {
          title: true,
          maxPoints: true,
          course: {
            select: {
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'asc'
    }
  })

  // Calculate attendance statistics
  const totalClasses = attendanceRecords.length
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length
  const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0

  // Calculate grade statistics
  const gradedSubmissions = submissions.filter(s => s.grade !== null)
  const totalPoints = gradedSubmissions.reduce((sum, s) => sum + (s.assignment.maxPoints || 0), 0)
  const earnedPoints = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0)
  const averageGrade = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

  return {
    child: child[0],
    weekPeriod: {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    },
    attendance: {
      records: attendanceRecords.map(r => ({
        date: r.date.toISOString().split('T')[0],
        course: r.course.title,
        instructor: r.course.instructor,
        status: r.status.toString(),
        notes: r.notes
      })),
      statistics: {
        totalClasses,
        presentCount,
        absentCount: attendanceRecords.filter(r => r.status === 'ABSENT').length,
        lateCount: attendanceRecords.filter(r => r.status === 'LATE').length,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    },
    grades: {
      submissions: submissions.map(s => ({
        assignment: s.assignment.title,
        course: s.assignment.course.title,
        maxPoints: s.assignment.maxPoints,
        grade: s.grade,
        submittedAt: s.submittedAt?.toISOString().split('T')[0],
        feedback: s.feedback || undefined
      })),
      statistics: {
        totalAssignments: submissions.length,
        gradedAssignments: gradedSubmissions.length,
        totalPoints,
        earnedPoints,
        averageGrade: Math.round(averageGrade * 100) / 100
      }
    }
  }
}

// Generate HTML email template
const generateEmailHTML = (reportData: any, parentName: string) => {
  const { child, weekPeriod, attendance, grades } = reportData
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weekly Report - ${child.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
        .header h1 { color: #1f2937; margin: 0; }
        .header p { color: #6b7280; margin: 5px 0; }
        .section { margin: 25px 0; }
        .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-item { text-align: center; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .record { padding: 10px; margin: 5px 0; border-left: 4px solid #e5e7eb; background-color: #f9fafb; }
        .record.present { border-left-color: #10b981; }
        .record.absent { border-left-color: #ef4444; }
        .record.late { border-left-color: #f59e0b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Report</h1>
          <p><strong>${child.name}</strong></p>
          <p>${weekPeriod.start} - ${weekPeriod.end}</p>
        </div>

        <div class="section">
          <h2>📊 Attendance Summary</h2>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${attendance.statistics.attendanceRate}%</div>
              <div class="stat-label">Attendance Rate</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${attendance.statistics.presentCount}</div>
              <div class="stat-label">Classes Attended</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${attendance.statistics.totalClasses}</div>
              <div class="stat-label">Total Classes</div>
            </div>
          </div>
          
          ${attendance.records.map((record: AttendanceRecord) => `
            <div class="record ${record.status.toLowerCase()}">
              <strong>${record.date}</strong> - ${record.course}<br>
              <small>Status: ${record.status} | Instructor: ${record.instructor}</small>
              ${record.notes ? `<br><small>Notes: ${record.notes}</small>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>📝 Grade Summary</h2>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${grades.statistics.averageGrade}%</div>
              <div class="stat-label">Average Grade</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${grades.statistics.gradedAssignments}</div>
              <div class="stat-label">Graded Assignments</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${grades.statistics.earnedPoints}/${grades.statistics.totalPoints}</div>
              <div class="stat-label">Points Earned</div>
            </div>
          </div>
          
          ${grades.submissions.map((submission: GradeSubmission) => `
            <div class="record">
              <strong>${submission.assignment}</strong> - ${submission.course}<br>
              <small>
                Grade: ${submission.grade !== null ? `${submission.grade}/${submission.maxPoints}` : 'Not graded yet'}
                ${submission.submittedAt ? ` | Submitted: ${submission.submittedAt}` : ''}
              </small>
              ${submission.feedback ? `<br><small>Feedback: ${submission.feedback}</small>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>This is an automated weekly report from Primis EduCare Learning Platform.</p>
          <p>If you have any questions, please contact your child's instructor or school administration.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Send weekly reports (can be called manually or via cron job)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // This endpoint can be called by admins or via a cron job
    if (session && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { parentId, studentId, force = false } = body

    const currentTime = getCurrentMongoliaTime()
    
    // Calculate week start (Monday) and end (Sunday)
    const weekStart = new Date(currentTime)
    const dayOfWeek = weekStart.getDay()
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Check if report already sent this week (unless forced)
    if (!force) {
      const existingReport = await prisma.weeklyReport.findFirst({
        where: {
          parentId,
          studentId,
          weekStart
        }
      })

      if (existingReport && existingReport.emailSent) {
        return NextResponse.json({ 
          message: 'Report already sent this week',
          report: existingReport 
        })
      }
    }

    // Get parent info
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, name: true, email: true }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Generate report data
    const reportData = await generateWeeklyReport(parentId, studentId, weekStart, weekEnd)
    
    // Generate email HTML
    const emailHTML = generateEmailHTML(reportData, parent.name || 'Parent')
    
    // Send email
    const emailResult = await sendEmail(
      parent.email,
      `Weekly Report - ${reportData.child.name} (${reportData.weekPeriod.start} - ${reportData.weekPeriod.end})`,
      emailHTML
    )

    // Save or update report record
    const reportRecord = await prisma.weeklyReport.upsert({
      where: {
        parentId_studentId_weekStart: {
          parentId,
          studentId,
          weekStart
        }
      },
      update: {
        weekEnd,
        sentAt: currentTime,
        emailSent: emailResult.success,
        attendanceData: JSON.stringify(reportData.attendance),
        gradesData: JSON.stringify(reportData.grades)
      },
      create: {
        parentId,
        studentId,
        weekStart,
        weekEnd,
        sentAt: currentTime,
        emailSent: emailResult.success,
        attendanceData: JSON.stringify(reportData.attendance),
        gradesData: JSON.stringify(reportData.grades)
      }
    })

    return NextResponse.json({
      message: 'Weekly report sent successfully',
      report: reportRecord,
      emailResult
    })
  } catch (error) {
    console.error('Error sending weekly report:', error)
    return NextResponse.json({ error: 'Failed to send weekly report' }, { status: 500 })
  }
}

// Get weekly reports for a parent
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Allow parents to view their own reports, admins to view all
    if (session.user.role !== 'PARENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Parent or admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = session.user.role === 'ADMIN' ? searchParams.get('parentId') : session.user.id
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = { parentId }
    if (studentId) {
      where.studentId = studentId
    }

    const reports = await prisma.weeklyReport.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        weekStart: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching weekly reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
