'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/components/providers/i18n-provider'
import { getProfileImageUrl } from '@/lib/images'
import { 
  UserCircleIcon, 
  CameraIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  emergencyContact?: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        emergencyContact: profile.emergencyContact || ''
      })
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      // Try Cloudinary first, then fallback to local storage
      let response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData
      })

      // If Cloudinary fails, try local storage
      if (!response.ok) {
        console.log('Cloudinary upload failed, trying local storage...')
        response = await fetch('/api/profile/image-local', {
          method: 'POST',
          body: formData
        })
      }

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, image: data.imageUrl } : null)
        
        // Update session to reflect new image
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            image: data.imageUrl
          }
        })
      } else {
        const error = await response.json()
        console.error('Upload error details:', error)
        alert(`Failed to upload image: ${error.error || error.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove your profile image?')) return

    try {
      const response = await fetch('/api/profile/image', {
        method: 'DELETE'
      })

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, image: undefined } : null)
        
        // Update session to reflect removed image
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            image: null
          }
        })
      } else {
        alert('Failed to remove image')
      }
    } catch (error) {
      console.error('Error removing image:', error)
      alert('Failed to remove image')
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        
        // Update session with new name
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: updatedProfile.name
          }
        })
      } else {
        const error = await response.json()
        alert(`Failed to update profile: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your profile information and preferences</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          {/* Profile Image Section */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {profile && getProfileImageUrl(profile.image) ? (
                <Image
                  src={getProfileImageUrl(profile.image)!}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    console.log('Profile image failed to load:', profile?.image)
                    // Hide the image on error
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <UserCircleIcon className="w-30 h-30 text-gray-400" />
              )}
              
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a profile photo to personalize your account
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  {profile?.image ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                {profile?.image && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateProfile}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      // Reset form data
                      if (profile) {
                        setFormData({
                          name: profile.name || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                          emergencyContact: profile.emergencyContact || ''
                        })
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{profile?.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                {editing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {profile?.dateOfBirth 
                      ? new Date(profile.dateOfBirth).toLocaleDateString() 
                      : 'Not set'
                    }
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {editing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.address || 'Not set'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Name and phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.emergencyContact || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <p className="text-gray-900 capitalize">{profile?.role?.toLowerCase()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
