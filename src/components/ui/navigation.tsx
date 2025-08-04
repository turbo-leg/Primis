'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useTranslation } from '@/components/providers/i18n-provider'
import NotificationDropdown from './notification-dropdown'
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  HomeIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  LanguageIcon,
  GlobeAltIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

export default function Navigation() {
  const { data: session, status } = useSession()
  const { t, language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false)
      setShowUserMenu(false)
      setShowLanguageMenu(false)
    }
    if (isOpen || showUserMenu || showLanguageMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, showUserMenu, showLanguageMenu])

  const getRoleStyles = () => {
    if (session?.user?.role === 'INSTRUCTOR') {
      return {
        bg: 'bg-gradient-to-r from-slate-900/95 via-indigo-900/95 to-slate-800/95',
        accent: 'text-indigo-300',
        hover: 'hover:bg-indigo-700/20 hover:text-indigo-200',
        brand: 'text-indigo-200',
        border: 'border-indigo-500/20',
        glow: 'shadow-xl shadow-indigo-500/10',
        button: 'bg-indigo-600/80 hover:bg-indigo-600 text-white',
        userBg: 'bg-indigo-500/10 border-indigo-400/30'
      }
    } else if (session?.user?.role === 'ADMIN') {
      return {
        bg: 'bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-800/95',
        accent: 'text-purple-300',
        hover: 'hover:bg-purple-700/20 hover:text-purple-200',
        brand: 'text-purple-200',
        border: 'border-purple-500/20',
        glow: 'shadow-xl shadow-purple-500/10',
        button: 'bg-purple-600/80 hover:bg-purple-600 text-white',
        userBg: 'bg-purple-500/10 border-purple-400/30'
      }
    } else if (session?.user?.role === 'PARENT') {
      return {
        bg: 'bg-gradient-to-r from-slate-900/95 via-green-900/95 to-slate-800/95',
        accent: 'text-green-300',
        hover: 'hover:bg-green-700/20 hover:text-green-200',
        brand: 'text-green-200',
        border: 'border-green-500/20',
        glow: 'shadow-xl shadow-green-500/10',
        button: 'bg-green-600/80 hover:bg-green-600 text-white',
        userBg: 'bg-green-500/10 border-green-400/30'
      }
    } else {
      return {
        bg: 'bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-800/95',
        accent: 'text-blue-300',
        hover: 'hover:bg-blue-700/20 hover:text-blue-200',
        brand: 'text-blue-200',
        border: 'border-blue-500/20',
        glow: 'shadow-xl shadow-blue-500/10',
        button: 'bg-blue-600/80 hover:bg-blue-600 text-white',
        userBg: 'bg-blue-500/10 border-blue-400/30'
      }
    }
  }

  const roleStyles = getRoleStyles()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${roleStyles.bg} ${roleStyles.glow} backdrop-blur-xl border-b ${roleStyles.border} ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            {/* Role-based logo and branding */}
            {session?.user?.role === 'INSTRUCTOR' ? (
              <Link href="/instructor" className="flex items-center group transition-all duration-300">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300 group-hover:scale-110">
                    <AcademicCapIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                    Primis EduCare
                  </h1>
                  <p className="text-xs text-indigo-300 font-medium">Instructor Portal</p>
                </div>
              </Link>
            ) : session?.user?.role === 'ADMIN' ? (
              <Link href="/admin" className="flex items-center group transition-all duration-300">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                    <Cog6ToothIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                    Primis EduCare
                  </h1>
                  <p className="text-xs text-purple-300 font-medium">Admin Dashboard</p>
                </div>
              </Link>
            ) : session?.user?.role === 'PARENT' ? (
              <Link href="/parent" className="flex items-center group transition-all duration-300">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
                    <UserIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">👨‍👩‍👧‍👦</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white group-hover:text-green-200 transition-colors">
                    Primis EduCare
                  </h1>
                  <p className="text-xs text-green-300 font-medium">Parent Portal</p>
                </div>
              </Link>
            ) : (
              <Link href="/" className="flex items-center group transition-all duration-300">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                  <BookOpenIcon className="h-7 w-7 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">
                    Primis EduCare
                  </h1>
                  <p className="text-xs text-blue-300 font-medium">Learning Platform</p>
                </div>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {/* Role-based navigation */}
              {session?.user?.role === 'INSTRUCTOR' ? (
                <>
                  <Link
                    href="/instructor"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleStyles.accent} ${roleStyles.hover}`}
                  >
                    <HomeIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/courses"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    Courses
                  </Link>
                  <Link
                    href="/virtual-classroom"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BuildingOffice2Icon className="h-4 w-4" />
                    Classroom
                  </Link>
                  <Link
                    href="/chat"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Chat
                  </Link>
                </>
              ) : session?.user?.role === 'ADMIN' ? (
                <>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleStyles.accent} ${roleStyles.hover}`}
                  >
                    <HomeIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/courses"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    Manage Courses
                  </Link>
                  <Link
                    href="/courses"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    Browse Courses
                  </Link>
                  <Link
                    href="/virtual-classroom"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BuildingOffice2Icon className="h-4 w-4" />
                    Classroom
                  </Link>
                  <Link
                    href="/chat"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Chat
                  </Link>
                </>
              ) : session?.user?.role === 'STUDENT' ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleStyles.accent} ${roleStyles.hover}`}
                  >
                    <HomeIcon className="h-4 w-4" />
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href="/courses"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    {t('nav.courses')}
                  </Link>
                  <Link
                    href="/virtual-classroom"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BuildingOffice2Icon className="h-4 w-4" />
                    {t('nav.virtualClassroom')}
                  </Link>
                  <Link
                    href="/chat"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    {t('nav.chat')}
                  </Link>
                </>
              ) : session?.user?.role === 'PARENT' ? (
                <>
                  <Link
                    href="/parent"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleStyles.accent} ${roleStyles.hover}`}
                  >
                    <HomeIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/parent#attendance"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                    Attendance
                  </Link>
                  <Link
                    href="/parent#grades"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <AcademicCapIcon className="h-4 w-4" />
                    Grades
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleStyles.accent} ${roleStyles.hover}`}
                  >
                    <HomeIcon className="h-4 w-4" />
                    {t('nav.home')}
                  </Link>
                  <Link
                    href="/courses"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    {t('nav.courses')}
                  </Link>
                  <Link
                    href="/about"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <BuildingOffice2Icon className="h-4 w-4" />
                    {t('nav.about')}
                  </Link>
                  <Link
                    href="/contact"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-300 ${roleStyles.hover}`}
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {t('nav.contact')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Menu & Actions */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLanguageMenu(!showLanguageMenu)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${roleStyles.hover} text-slate-300`}
                    title="Change Language"
                  >
                    <GlobeAltIcon className="h-5 w-5" />
                    <span className="hidden sm:block text-sm font-medium uppercase">
                      {language || 'EN'}
                    </span>
                    <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${showLanguageMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Language Dropdown */}
                  {showLanguageMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl ${roleStyles.bg} border ${roleStyles.border} backdrop-blur-xl z-50 py-2`}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setLanguage('en')
                            setShowLanguageMenu(false)
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-all duration-200 ${
                            language === 'en' ? roleStyles.accent : 'text-slate-300'
                          } ${roleStyles.hover}`}
                        >
                          <span className="text-lg">🇺🇸</span>
                          <div className="text-left">
                            <p className="font-medium">English</p>
                            <p className="text-xs text-slate-400">United States</p>
                          </div>
                          {language === 'en' && (
                            <div className="ml-auto">
                              <div className="h-2 w-2 bg-current rounded-full"></div>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('mn')
                            setShowLanguageMenu(false)
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-all duration-200 ${
                            language === 'mn' ? roleStyles.accent : 'text-slate-300'
                          } ${roleStyles.hover}`}
                        >
                          <span className="text-lg">🇲🇳</span>
                          <div className="text-left">
                            <p className="font-medium">Монгол</p>
                            <p className="text-xs text-slate-400">Mongolia</p>
                          </div>
                          {language === 'mn' && (
                            <div className="ml-auto">
                              <div className="h-2 w-2 bg-current rounded-full"></div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <NotificationDropdown roleStyles={roleStyles} />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowUserMenu(!showUserMenu)
                    }}
                    className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-200 ${roleStyles.userBg} border ${roleStyles.border} ${roleStyles.hover}`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${roleStyles.button}`}>
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white">{session.user?.name}</p>
                      <p className="text-xs text-slate-400">{session.user?.role}</p>
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl ${roleStyles.bg} border ${roleStyles.border} backdrop-blur-xl z-50 py-2`}>
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <p className="text-sm font-medium text-white">{session.user?.name}</p>
                        <p className="text-xs text-slate-400">{session.user?.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className={`flex items-center gap-3 px-4 py-2 text-sm text-slate-300 ${roleStyles.hover} transition-all duration-200`}
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile Settings
                        </Link>
                        {session?.user?.role === 'INSTRUCTOR' && (
                          <Link
                            href="/instructor"
                            className={`flex items-center gap-3 px-4 py-2 text-sm text-slate-300 ${roleStyles.hover} transition-all duration-200`}
                          >
                            <HomeIcon className="h-4 w-4" />
                            Instructor Dashboard
                          </Link>
                        )}
                        {session?.user?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-2 text-sm text-slate-300 ${roleStyles.hover} transition-all duration-200`}
                          >
                            <HomeIcon className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}
                        {session?.user?.role === 'STUDENT' && (
                          <Link
                            href="/dashboard"
                            className={`flex items-center gap-3 px-4 py-2 text-sm text-slate-300 ${roleStyles.hover} transition-all duration-200`}
                          >
                            <HomeIcon className="h-4 w-4" />
                            Student Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Language Selector for non-authenticated users */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLanguageMenu(!showLanguageMenu)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${roleStyles.hover} text-slate-300`}
                    title="Change Language"
                  >
                    <GlobeAltIcon className="h-5 w-5" />
                    <span className="hidden sm:block text-sm font-medium uppercase">
                      {language || 'EN'}
                    </span>
                    <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${showLanguageMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Language Dropdown */}
                  {showLanguageMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl ${roleStyles.bg} border ${roleStyles.border} backdrop-blur-xl z-50 py-2`}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setLanguage('en')
                            setShowLanguageMenu(false)
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-all duration-200 ${
                            language === 'en' ? roleStyles.accent : 'text-slate-300'
                          } ${roleStyles.hover}`}
                        >
                          <span className="text-lg">🇺🇸</span>
                          <div className="text-left">
                            <p className="font-medium">English</p>
                            <p className="text-xs text-slate-400">United States</p>
                          </div>
                          {language === 'en' && (
                            <div className="ml-auto">
                              <div className="h-2 w-2 bg-current rounded-full"></div>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('mn')
                            setShowLanguageMenu(false)
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-all duration-200 ${
                            language === 'mn' ? roleStyles.accent : 'text-slate-300'
                          } ${roleStyles.hover}`}
                        >
                          <span className="text-lg">🇲🇳</span>
                          <div className="text-left">
                            <p className="font-medium">Монгол</p>
                            <p className="text-xs text-slate-400">Mongolia</p>
                          </div>
                          {language === 'mn' && (
                            <div className="ml-auto">
                              <div className="h-2 w-2 bg-current rounded-full"></div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/auth/signin"
                  className={`p-3 rounded-lg transition-all duration-200 ${roleStyles.hover} text-slate-300 hover:scale-110 transform`}
                  title="Sign In"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all duration-200"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-700/50">
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${roleStyles.bg} backdrop-blur-xl`}>
            {session?.user?.role === 'INSTRUCTOR' ? (
              <>
                <Link href="/instructor" className="text-indigo-300 hover:bg-indigo-700/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Dashboard
                </Link>
                <Link href="/courses" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Courses
                </Link>
                <Link href="/virtual-classroom" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Virtual Classroom
                </Link>
                <Link href="/chat" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Chat
                </Link>
              </>
            ) : session?.user?.role === 'ADMIN' ? (
              <>
                <Link href="/admin" className="text-purple-300 hover:bg-purple-700/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Dashboard
                </Link>
                <Link href="/admin/courses" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Manage Courses
                </Link>
                <Link href="/courses" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Browse Courses
                </Link>
                <Link href="/virtual-classroom" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Virtual Classroom
                </Link>
                <Link href="/chat" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  Chat
                </Link>
              </>
            ) : session?.user?.role === 'STUDENT' ? (
              <>
                <Link href="/dashboard" className="text-blue-300 hover:bg-blue-700/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.dashboard')}
                </Link>
                <Link href="/courses" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.courses')}
                </Link>
                <Link href="/virtual-classroom" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.virtualClassroom')}
                </Link>
                <Link href="/chat" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.chat')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-blue-300 hover:bg-blue-700/20 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.home')}
                </Link>
                <Link href="/courses" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.courses')}
                </Link>
                <Link href="/about" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.about')}
                </Link>
                <Link href="/contact" className="text-slate-300 hover:bg-slate-700/50 block px-3 py-2 rounded-md text-base font-medium transition-all duration-200">
                  {t('nav.contact')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}