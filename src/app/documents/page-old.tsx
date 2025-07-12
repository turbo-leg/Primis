'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/components/providers/i18n-provider'
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { redirect } from 'next/navigation'

interface Document {
  id: string
  title: string
  description?: string
  filename: string
  fileSize: number
  fileType: string
  courseId?: string
  courseName?: string
  uploadedBy: string
  uploadedAt: string
  isPublic: boolean
}

export default function Documents() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDocuments = async () => {
    try {
      setError(null)
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const documents = await response.json()
      setDocuments(documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error instanceof Error ? error.message : 'Failed to load documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = useCallback(() => {
    let filtered = documents

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((doc: Document) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'public') {
        filtered = filtered.filter((doc: Document) => doc.isPublic)
      } else if (selectedCategory === 'private') {
        filtered = filtered.filter((doc: Document) => !doc.isPublic)
      } else {
        filtered = filtered.filter((doc: Document) => doc.courseName?.toLowerCase().includes(selectedCategory))
      }
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, selectedCategory])

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [filterDocuments])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <DocumentTextIcon className="h-8 w-8 text-red-400" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <DocumentTextIcon className="h-8 w-8 text-blue-400" />
    } else {
      return <DocumentTextIcon className="h-8 w-8 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  // Show loading if session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <FolderIcon className="h-8 w-8 text-red-500" />
                {t('documents.title')}
              </h1>
              <p className="text-gray-300 mt-1">{t('documents.subtitle')}</p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              {t('documents.upload')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('documents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">{t('documents.allCategories')}</option>
            <option value="public">{t('documents.publicDocuments')}</option>
            <option value="private">{t('documents.courseDocuments')}</option>
            <option value="sat">{t('documents.satMaterials')}</option>
            <option value="ielts">{t('documents.ieltsMaterials')}</option>
          </select>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FolderIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              {t('documents.noDocuments')}
            </h3>
            <p className="text-gray-300">
              {t('documents.noDocumentsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all transform hover:-translate-y-1"
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.fileType)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {document.title}
                      </h3>
                      {document.courseName && (
                        <span className="inline-block bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full mt-1">
                          {document.courseName}
                        </span>
                      )}
                    </div>
                  </div>
                  {document.isPublic && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </div>

                {/* Document Description */}
                {document.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {document.description}
                  </p>
                )}

                {/* Document Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('documents.size')}:</span>
                    <span className="text-gray-300">{formatFileSize(document.fileSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('documents.uploadedBy')}:</span>
                    <span className="text-gray-300">{document.uploadedBy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('documents.uploadedAt')}:</span>
                    <span className="text-gray-300">{formatDate(document.uploadedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                    <EyeIcon className="h-4 w-4" />
                    {t('documents.view')}
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  {session?.user?.role === 'ADMIN' && (
                    <button 
                      onClick={() => {
                        setDocumentToDelete(document)
                        setDeleteModalOpen(true)
                      }}
                      className="bg-white/20 hover:bg-red-500 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{t('documents.uploadDocument')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('documents.documentTitle')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t('documents.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('documents.description')}
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder={t('documents.descriptionPlaceholder')}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('documents.selectFile')}
                </label>
                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">{t('documents.dragDropFile')}</p>
                  <button className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    {t('documents.browseFiles')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors">
                {t('documents.uploadButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && documentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{t('documents.deleteDocument')}</h3>
            <p className="text-gray-300 mb-4">
              {t('documents.deleteDocumentDesc')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!documentToDelete) return
                  setDeleting(true)
                  try {
                    const response = await fetch(`/api/documents/${documentToDelete.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    })
                    if (!response.ok) {
                      throw new Error('Failed to delete document')
                    }
                    setDeleteModalOpen(false)
                    setDocumentToDelete(null)
                    fetchDocuments() // Refresh documents list
                  } catch (error) {
                    console.error('Error deleting document:', error)
                    setError(error instanceof Error ? error.message : 'Failed to delete document')
                    setDeleting(false)
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors"
              >
                {deleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
