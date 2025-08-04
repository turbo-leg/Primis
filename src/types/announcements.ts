// Types for announcements
export interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  publishedAt?: string | null
  isDraft: boolean
  author: {
    id: string
    name: string
    role: string
  }
  isImportant: boolean
}

export interface CreateAnnouncementData {
  title: string
  content: string
  priority: 'low' | 'normal' | 'high'
  isImportant: boolean
  isDraft: boolean
}