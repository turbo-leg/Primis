'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  DocumentArrowUpIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowUpIcon,
  Bars3BottomLeftIcon,
  PhotoIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface AssignmentSubmissionProps {
  assignmentId: string
  assignmentTitle: string
  assignmentDescription?: string
  dueDate?: string
  maxPoints?: number
  instructions?: string
  onSubmissionSuccess?: () => void
}

interface ExistingSubmission {
  id: string
  content: string
  fileUrl?: string
  fileName?: string
  submittedAt: string
  status: 'SUBMITTED' | 'GRADED' | 'LATE' | 'DRAFT'
  grade?: number
  feedback?: string
  gradedAt?: string
}

interface FilePreview {
  name: string
  size: number
  type: string
  url?: string
}

export default function AssignmentSubmission({
  assignmentId,
  assignmentTitle,
  assignmentDescription,
  dueDate,
  maxPoints,
  instructions,
  onSubmissionSuccess
}: AssignmentSubmissionProps) {
  const { data: session } = useSession()
  
  // Form state
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [existingSubmission, setExistingSubmission] = useState<ExistingSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(false)
  const [submissionMode, setSubmissionMode] = useState<'text' | 'file' | 'both'>('both')
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // Check for existing submission
  useEffect(() => {
    fetchExistingSubmission()
  }, [assignmentId])

  const fetchExistingSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions?assignmentId=${assignmentId}`)
      if (response.ok) {
        const submissions = await response.json()
        if (submissions.length > 0) {
          const submission = submissions[0]
          setExistingSubmission(submission)
          setContent(submission.content || '')
        }
      }
    } catch (error) {
      console.error('Error fetching existing submission:', error)
    } finally {
      setLoading(false)
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect([e.dataTransfer.files[0]])
    }
  }

  const handleFileSelect = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    
    const selectedFile = files[0]
    if (!selectedFile) return

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 25MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/zip',
      'application/x-zip-compressed'
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please select a document, image, or zip file.')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !file) {
      setError('Please provide either written content or upload a file')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('assignmentId', assignmentId)
      formData.append('content', content.trim())
      
      if (file) {
        formData.append('file', file)
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 200)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      const result = await response.json()
      setSuccess('Assignment submitted successfully!')
      setExistingSubmission(result.submission)
      
      // Clear form
      setContent('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (onSubmissionSuccess) {
        onSubmissionSuccess()
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null)
        setUploadProgress(0)
      }, 5000)

    } catch (error) {
      console.error('Submission error:', error)
      setError(error instanceof Error ? error.message : 'Submission failed')
      setUploadProgress(0)
    } finally {
      setSubmitting(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <PhotoIcon className="h-5 w-5" />
    if (fileType.includes('pdf')) return <DocumentTextIcon className="h-5 w-5" />
    return <DocumentIcon className="h-5 w-5" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'GRADED': return 'text-green-700 bg-green-100 border-green-200'
      case 'LATE': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'DRAFT': return 'text-slate-700 bg-slate-100 border-slate-200'
      default: return 'text-slate-700 bg-slate-100 border-slate-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isOverdue = dueDate && new Date() > new Date(dueDate)
  const canSubmit = session?.user?.role === 'STUDENT' && (!isOverdue || !existingSubmission)
  const timeUntilDue = dueDate ? new Date(dueDate).getTime() - new Date().getTime() : null
  const daysUntilDue = timeUntilDue ? Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24)) : null

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded-xl w-1/3"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-700 font-medium">{success}</p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-green-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Submission Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                {assignmentTitle}
              </h2>
              {assignmentDescription && (
                <p className="text-slate-600 text-sm leading-relaxed">
                  {assignmentDescription}
                </p>
              )}
            </div>
          </div>

          {/* Assignment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {dueDate && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <CalendarIcon className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Due Date</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatDate(dueDate)}
                    </p>
                    {!isOverdue && daysUntilDue !== null && (
                      <p className="text-xs text-slate-500">
                        {daysUntilDue === 0 ? 'Due today!' : `${daysUntilDue} days left`}
                      </p>
                    )}
                    {isOverdue && <p className="text-xs text-red-600">Overdue</p>}
                  </div>
                </div>
              </div>
            )}
            
            {maxPoints && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <StarIcon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Max Points</p>
                    <p className="text-sm font-medium text-slate-800">{maxPoints}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${existingSubmission ? 'bg-green-100' : 'bg-slate-200'}`}>
                  <ClockIcon className={`h-4 w-4 ${existingSubmission ? 'text-green-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <p className={`text-sm font-medium ${existingSubmission ? 'text-green-600' : 'text-slate-500'}`}>
                    {existingSubmission ? 'Submitted' : 'Not Submitted'}
                  </p>
                </div>
              </div>
            </div>

            {existingSubmission?.grade !== null && existingSubmission?.grade !== undefined && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <AcademicCapIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Grade</p>
                    <p className="text-sm font-medium text-slate-800">
                      {existingSubmission.grade}{maxPoints ? `/${maxPoints}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Toggle */}
          {instructions && (
            <div className="mt-4">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showInstructions ? 'Hide' : 'Show'} Instructions
                </span>
              </button>
              
              {showInstructions && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {instructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing Submission Display */}
        {existingSubmission && (
          <div className="p-6 border-b border-slate-200">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    Previous Submission
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-600">
                      Submitted: {formatDate(existingSubmission.submittedAt)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(existingSubmission.status)}`}>
                      {existingSubmission.status}
                    </span>
                  </div>
                </div>
                
                {existingSubmission.grade !== null && existingSubmission.grade !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">
                      {existingSubmission.grade}
                      {maxPoints && <span className="text-slate-500">/{maxPoints}</span>}
                    </div>
                    <div className="text-sm text-slate-500">Grade</div>
                  </div>
                )}
              </div>

              {existingSubmission.content && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Written Response:</h5>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {existingSubmission.content}
                    </p>
                  </div>
                </div>
              )}

              {existingSubmission.fileUrl && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">File Submission:</h5>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(existingSubmission.fileName || '')}
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {existingSubmission.fileName || 'Submitted File'}
                          </p>
                          <p className="text-xs text-slate-500">Click to download</p>
                        </div>
                      </div>
                      <a
                        href={existingSubmission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-600 transition-all"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span className="text-sm">Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {existingSubmission.feedback && (
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">Instructor Feedback:</h5>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {existingSubmission.feedback}
                    </p>
                    {existingSubmission.gradedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Graded on {formatDate(existingSubmission.gradedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && (
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <PencilIcon className="h-5 w-5 text-purple-600" />
                {existingSubmission ? 'Update Submission' : 'New Submission'}
              </h4>
              <p className="text-slate-600 text-sm">
                {existingSubmission 
                  ? 'You can update your submission before the due date.'
                  : 'Submit your assignment using the form below.'}
              </p>
            </div>

            {/* Submission Mode Selector */}
            <div className="mb-6">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setSubmissionMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    submissionMode === 'text' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Bars3BottomLeftIcon className="h-4 w-4" />
                  Text Only
                </button>
                <button
                  onClick={() => setSubmissionMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    submissionMode === 'file' 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  File Only
                </button>
                <button
                  onClick={() => setSubmissionMode('both')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    submissionMode === 'both' 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  Text + File
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Text Content */}
              {(submissionMode === 'text' || submissionMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Written Response
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter your assignment response here..."
                      className="w-full px-4 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[150px] transition-all"
                      style={{ height: 'auto' }}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                      {content.length} characters
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {(submissionMode === 'file' || submissionMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    File Attachment
                  </label>
                  
                  {!file ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        dragActive 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl">
                            <CloudArrowUpIcon className="h-12 w-12 text-blue-600" />
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-slate-800 font-medium mb-1">
                            Drag and drop your file here
                          </p>
                          <p className="text-slate-500 text-sm mb-4">
                            or click to browse from your computer
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95"
                          >
                            Choose File
                          </button>
                        </div>
                        
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Supported: PDF, Word, PowerPoint, Text, Markdown, Images, ZIP</p>
                          <p>Maximum file size: 25MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">{file.name}</p>
                            <p className="text-slate-500 text-sm">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting || (!content.trim() && !file)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 min-w-[200px] justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      <span>{existingSubmission ? 'Update Submission' : 'Submit Assignment'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Access Denied Messages */}
        {session?.user?.role !== 'STUDENT' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-blue-700 font-medium">
                Assignment submissions are only available for students.
              </p>
            </div>
          </div>
        )}

        {isOverdue && existingSubmission && (
          <div className="p-6">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <ClockIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-orange-700 font-medium">
                This assignment is overdue. No further submissions are allowed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
