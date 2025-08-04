'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useTranslation } from '@/components/providers/i18n-provider'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  bio?: string
  location?: string
  joinDate: string
  profileImage?: string
  preferences: {
    language: string
    notifications: boolean
    theme: string
  }
  stats: {
    coursesEnrolled: number
    coursesCompleted: number
    totalStudyHours: number
    averageGrade: string
  }
}

export default function Profile() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    location: ''
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockProfile: UserProfile = {
        id: session?.user?.id || '1',
        name: session?.user?.name || 'John Doe',
        email: session?.user?.email || 'john.doe@example.com',
        phone: '+976 9999 1234',
        role: session?.user?.role || 'STUDENT',
        bio: 'Passionate student preparing for SAT and college applications. Love mathematics and science.',
        location: 'Ulaanbaatar, Mongolia',
        joinDate: '2024-01-15',
        profileImage: session?.user?.image || undefined,
        preferences: {
          language: 'en',
          notifications: true,
          theme: 'dark'
        },
        stats: {
          coursesEnrolled: 3,
          coursesCompleted: 1,
          totalStudyHours: 156,
          averageGrade: 'A-'
        }
      }

      setProfile(mockProfile)
      setEditForm({
        name: mockProfile.name,
        phone: mockProfile.phone || '',
        bio: mockProfile.bio || '',
        location: mockProfile.location || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // In a real app, this would make an API call to update the profile
      if (profile) {
        setProfile({
          ...profile,
          name: editForm.name,
          phone: editForm.phone,
          bio: editForm.bio,
          location: editForm.location
        })
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || ''
      })
    }
    setIsEditing(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="text-white mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a30] via-[#0a1554] to-[#1a2570]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-blue-400" />
            {t('profile.title')}
          </h1>
          <p className="text-gray-300 mt-2">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{t('profile.basicInfo')}</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {t('profile.edit')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {t('profile.save')}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {t('profile.cancel')}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors">
                    <CameraIcon className="h-4 w-4 text-white" />
                  </button>
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {t('profile.name')}
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {t('profile.phone')}
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{profile.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-300">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-300">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span className="capitalize">{profile.role.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('profile.bio')}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-300">{profile.bio || 'No bio provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('profile.location')}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your location"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{profile.location || 'Location not specified'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">{t('profile.preferences')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('profile.language')}
                  </label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="en">English</option>
                    <option value="mn">Mongolian</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{t('profile.emailNotifications')}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('profile.theme')}
                  </label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Study Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">{t('profile.studyStats')}</h3>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{profile.stats.coursesEnrolled}</div>
                  <div className="text-sm text-gray-300">{t('profile.coursesEnrolled')}</div>
                </div>
                
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{profile.stats.coursesCompleted}</div>
                  <div className="text-sm text-gray-300">{t('profile.coursesCompleted')}</div>
                </div>
                
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{profile.stats.totalStudyHours}</div>
                  <div className="text-sm text-gray-300">{t('profile.studyHours')}</div>
                </div>
                
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{profile.stats.averageGrade}</div>
                  <div className="text-sm text-gray-300">{t('profile.averageGrade')}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">{t('profile.quickActions')}</h3>
              
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-left">
                  {t('profile.changePassword')}
                </button>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-left">
                  {t('profile.downloadCertificates')}
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-left">
                  {t('profile.exportData')}
                </button>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-left">
                  {t('profile.deleteAccount')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
