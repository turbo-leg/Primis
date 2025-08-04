'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  DocumentArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface AssignmentFile {
  id: string
  title: string
  description?: string
  filename: string
  mimeType: string
  fileSize: number
  fileType: 'document' | 'image'
  fileUrl: string
  uploadedAt: string
  uploadedBy: {
    id: string
    name: string
    role: string
  }
}

interface AssignmentFileUploadProps {
  assignmentId: string
  onFileUploaded?: (file: AssignmentFile) => void
  onFileDeleted?: (fileId: string) => void
  maxFiles?: number
  allowedTypes?: ('document' | 'image')[]
  existingFiles?: AssignmentFile[]
}

export default function AssignmentFileUpload({
  assignmentId,
  onFileUploaded,
  onFileDeleted,
  maxFiles = 10,
  allowedTypes = ['document', 'image'],
  existingFiles = []
}: AssignmentFileUploadProps) {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [files, setFiles] = useState<AssignmentFile[]>(existingFiles)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const canUploadDocuments = allowedTypes.includes('document')
  const canUploadImages = allowedTypes.includes('image')

  const handleFileSelect = async (selectedFiles: FileList | null, fileType: 'document' | 'image') => {
    if (!selectedFiles || selectedFiles.length === 0) return

    if (files.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const file = selectedFiles[0]
    await uploadFile(file, fileType)
  }

  const uploadFile = async (file: File, fileType: 'document' | 'image') => {
    if (!file) return

    // Validate file type
    const isImage = fileType === 'image'
    const allowedMimeTypes = isImage 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : [
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'image/jpeg', 
          'image/jpg', 
          'image/png', 
          'image/gif', 
          'image/webp'
        ]

    if (!allowedMimeTypes.includes(file.type)) {
      setError(`Invalid file type. Please select a valid ${fileType}.`)
      return
    }

    // Validate file size
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB for images, 10MB for documents
    if (file.size > maxSize) {
      const sizeLimit = isImage ? '5MB' : '10MB'
      setError(`File size must be less than ${sizeLimit}`)
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('assignmentId', assignmentId)
      formData.append('title', file.name)
      formData.append('fileType', fileType)

      const response = await fetch('/api/assignments/files', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadedFile = await response.json()
      setFiles(prev => [...prev, uploadedFile])
      setSuccess(`${fileType === 'image' ? 'Image' : 'Document'} uploaded successfully!`)
      
      if (onFileUploaded) {
        onFileUploaded(uploadedFile)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/assignments/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      setFiles(prev => prev.filter(f => f.id !== fileId))
      if (onFileDeleted) {
        onFileDeleted(fileId)
      }
      setSuccess('File deleted successfully')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error('Delete error:', error)
      setError('Failed to delete file')
    }
  }

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
      const file = e.dataTransfer.files[0]
      const isImage = file.type.startsWith('image/')
      const fileType = isImage ? 'image' : 'document'
      
      if (allowedTypes.includes(fileType)) {
        uploadFile(file, fileType)
      } else {
        setError(`${fileType === 'image' ? 'Images' : 'Documents'} are not allowed for this assignment`)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-purple-400" />
    }
    return <DocumentIcon className="h-8 w-8 text-blue-400" />
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DocumentArrowUpIcon className="h-5 w-5 text-green-400" />
          Upload Files
        </h3>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {canUploadDocuments && (
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400" />
              )}
              {canUploadImages && (
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-white font-medium mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-gray-400 text-sm">
                {canUploadDocuments && canUploadImages && 'Documents and images supported'}
                {canUploadDocuments && !canUploadImages && 'Documents only'}
                {!canUploadDocuments && canUploadImages && 'Images only'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Max {maxFiles} files • Documents up to 10MB • Images up to 5MB
              </p>
            </div>

            <div className="flex gap-3">
              {canUploadDocuments && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || files.length >= maxFiles}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <DocumentArrowUpIcon className="h-4 w-4" />
                  Upload Document
                </button>
              )}

              {canUploadImages && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading || files.length >= maxFiles}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <PhotoIcon className="h-4 w-4" />
                  Upload Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={(e) => handleFileSelect(e.target.files, 'document')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files, 'image')}
          className="hidden"
        />

        {/* Upload Status */}
        {uploading && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <p className="text-blue-300">Uploading file...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Uploaded Files ({files.length}/{maxFiles})
          </h3>
          
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white/5 rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
              >
                {getFileIcon(file.mimeType)}
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{file.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span>{file.filename}</span>
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>by {file.uploadedBy.name}</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  {file.description && (
                    <p className="text-gray-300 text-sm mt-1">{file.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    View
                  </a>
                  
                  {session?.user?.id === file.uploadedBy.id && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                      title="Delete file"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}