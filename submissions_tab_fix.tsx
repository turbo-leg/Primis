// Fix for JSX parsing error in SubmissionsTab component
// The issue is likely a missing return statement or improper indentation

import { ClockIcon, DocumentTextIcon, AcademicCapIcon, UserIcon } from "@heroicons/react/24/outline"

const SubmissionsTab = () => {
  const submissions = [
    {
      id: '1',
      student: { name: 'John Doe', email: 'john@example.com' },
      assignment: { title: 'Linear Algebra Project' },
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      grade: null
    },
    {
      id: '2',
      student: { name: 'Jane Smith', email: 'jane@example.com' },
      assignment: { title: 'Calculus Problem Set' },
      submittedAt: new Date().toISOString(),
      status: 'GRADED',
      grade: 95
    }
  ]

  const pendingCount = submissions.filter(s => !s.grade).length
  const gradedCount = submissions.filter(s => s.grade).length

  return (
    <div className="space-y-6">
      {/* Grading Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{pendingCount}</div>
              <div className="text-sm text-yellow-400">Pending Reviews</div>
            </div>
          </div>
        </div>
        <div className="bg-green-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-green-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{gradedCount}</div>
              <div className="text-sm text-green-400">Graded</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-600/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <div className="text-2xl font-bold text-white">{submissions.length}</div>
              <div className="text-sm text-blue-400">Total Submissions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
            <p>Student submissions will appear here when they submit their assignments.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{submission.student.name}</h3>
                        <p className="text-sm text-slate-400">{submission.student.email}</p>
                      </div>
                    </div>
                    <div className="ml-13">
                      <p className="text-slate-300 mb-1">
                        <span className="font-medium">Assignment:</span> {submission.assignment.title}
                      </p>
                      <p className="text-sm text-slate-400">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {submission.grade ? (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{submission.grade}%</div>
                        <div className="text-xs text-green-300">Graded</div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-400">Pending Review</div>
                        <button className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                          Grade Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}