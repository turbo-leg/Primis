'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  DocumentIcon, 
  PlusIcon, 
  ArrowDownTrayIcon, 
  TrashIcon,
  PhotoIcon,
  DocumentTextIcon,
  FilmIcon
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  title: string
  filename: string
  fileType: string
  fileSize: number
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    role: string
  }
  courseId: string | null
  courseName: string | null
}

export default function Documents() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents/upload')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const docs = await response.json()
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />
    } else if (fileType.startsWith('video/')) {
      return <FilmIcon className="h-8 w-8 text-purple-500" />
    } else if (fileType.includes('pdf')) {
      return <DocumentIcon className="h-8 w-8 text-red-500" />
    } else {
      return <DocumentTextIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename
    
    const lastDotIndex = filename.lastIndexOf('.')
    const extension = lastDotIndex > -1 ? filename.substring(lastDotIndex) : ''
    const nameWithoutExt = lastDotIndex > -1 ? filename.substring(0, lastDotIndex) : filename
    
    const maxNameLength = maxLength - extension.length - 3 // Reserve space for "..." and extension
    if (maxNameLength <= 0) return filename.substring(0, maxLength)
    
    return nameWithoutExt.substring(0, maxNameLength) + '...' + extension
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear any previous errors
    setError(null)
    setLoading(true)
    setUploadProgress(20)

    try {
      // Basic client-side validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File must be smaller than 5MB')
      }

      // Check for very long file names and warn user
      const maxFilenameLength = 100 // Match server-side limit
      if (file.name.length > maxFilenameLength) {
        const lastDotIndex = file.name.lastIndexOf('.')
        const extension = lastDotIndex > -1 ? file.name.substring(lastDotIndex) : ''
        const nameWithoutExt = lastDotIndex > -1 ? file.name.substring(0, lastDotIndex) : file.name
        
        // Clean the filename like server does
        let cleanedName = nameWithoutExt
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_+|_+$/g, '')
        
        const maxNameLength = maxFilenameLength - extension.length
        const truncatedName = cleanedName.substring(0, maxNameLength) + extension
        
        if (!confirm(`File name will be cleaned and shortened to:\n"${truncatedName}"\n\nContinue with upload?`)) {
          setLoading(false)
          setUploadProgress(0)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      setUploadProgress(50)

      console.log('Uploading file:', file.name, file.size, 'bytes')

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(80)

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || `Upload failed (${response.status})`)
      }

      // Success
      setDocuments(prev => [responseData, ...prev])
      setUploadProgress(100)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Clear progress after showing success
      setTimeout(() => setUploadProgress(0), 2000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      console.log('Deleting document:', documentId)
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || `Delete failed (${response.status})`)
      }

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      console.log('Document deleted successfully')
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="mb-6 bg-white rounded-lg p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Documents Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate pr-2" title={document.title}>
                          {document.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1">
                          <span className="text-sm text-gray-500 font-mono break-all" title={document.filename}>
                            <span className="sm:hidden">{truncateFilename(document.filename, 20)}</span>
                            <span className="hidden sm:inline">{truncateFilename(document.filename, 35)}</span>
                          </span>
                          {(document.filename.includes('_') || document.filename.length >= 80) && (
                            <span className="text-xs text-blue-600 whitespace-nowrap mt-1 sm:mt-0" title="Filename was cleaned/shortened for compatibility">
                              (processed)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          // For development, show a message about download functionality
                          alert(`Download functionality: ${document.filename}\nFile Type: ${document.fileType}\nSize: ${formatFileSize(document.fileSize)}`)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      
                      {(session?.user?.id === document.uploadedBy.id || 
                        session?.user?.role === 'INSTRUCTOR' || 
                        session?.user?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Uploaded by {document.uploadedBy.name}
                        {document.uploadedBy.role === 'INSTRUCTOR' && (
                          <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Instructor
                          </span>
                        )}
                      </span>
                      <span>
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {document.courseName && (
                      <div className="mt-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {document.courseName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {documents.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
