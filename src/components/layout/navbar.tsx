'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '../providers/i18n-provider'
import { LanguageSwitcher } from '../ui/language-switcher'

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t } = useTranslation()

  const navigation = [
    { name: t('navigation.home'), href: '/', icon: BookOpenIcon },
    { name: t('navigation.courses'), href: '/courses', icon: BookOpenIcon },
    { name: t('navigation.schedule'), href: '/schedule', icon: CalendarDaysIcon },
    { name: t('navigation.contact'), href: '/contact', icon: DocumentTextIcon },
  ]

  const dashboardNavigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: BookOpenIcon },
    { name: t('courses.title'), href: '/dashboard/courses', icon: BookOpenIcon },
    { name: t('navigation.schedule'), href: '/dashboard/schedule', icon: CalendarDaysIcon },
    { name: t('navigation.chat'), href: '/dashboard/chat', icon: ChatBubbleLeftRightIcon },
    { name: t('navigation.documents'), href: '/dashboard/documents', icon: DocumentTextIcon },
  ]

  return (
    <nav className="bg-white/10 backdrop-blur-sm shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BookOpenIcon className="h-8 w-8 text-red-500" />
              <span className="ml-2 text-xl font-bold text-white">
                Primis Educare
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {session ? (
              <>
                {dashboardNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Authentication */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('navigation.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => signIn()}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('navigation.signIn')}
                  </button>
                  <Link
                    href="/auth/signup"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('navigation.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/10 backdrop-blur-sm">
            {session ? (
              <>
                {dashboardNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}
            
            {/* Mobile Authentication */}
            <div className="pt-4 pb-3 border-t border-white/20">
              {session ? (
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {session.user?.name}
                    </div>
                    <div className="text-sm font-medium text-gray-300">
                      {session.user?.email}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => signOut()}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {t('navigation.signOut')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => signIn()}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    {t('navigation.signIn')}
                  </button>
                  <Link
                    href="/auth/signup"
                    className="bg-red-600 hover:bg-red-700 text-white block px-3 py-2 rounded-md text-base font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navigation.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
