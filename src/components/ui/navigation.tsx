'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from '@/components/providers/i18n-provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import {
  HomeIcon,
  BookOpenIcon,
  PhoneIcon,
  Squares2X2Icon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export function Navigation() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: HomeIcon, public: true },
    { href: '/courses', label: t('nav.courses'), icon: BookOpenIcon, public: true },
    { href: '/contact', label: t('nav.contact'), icon: PhoneIcon, public: true },
  ]

  const authenticatedLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Squares2X2Icon },
    { href: '/schedule', label: t('nav.schedule'), icon: CalendarIcon },
    { href: '/dashboard/chat', label: t('nav.chat'), icon: ChatBubbleLeftRightIcon },
    { href: '/documents', label: t('nav.documents'), icon: DocumentTextIcon },
  ]

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">
                PRIMIS
              </div>
              <div className="text-xs text-gray-300 font-light -mt-1">
                EDUCARE
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}

            {/* Authenticated User Links */}
            {status === 'authenticated' && (
              <>
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                {authenticatedLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                
                {/* Admin Link */}
                {session?.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin" 
                    className="text-white hover:text-red-300 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 px-3 py-2 rounded-lg border border-red-500/30 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    {t('nav.admin')}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side - Language Switcher & Auth */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : session ? (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                  <UserIcon className="h-4 w-4 text-blue-300" />
                  <span className="text-white text-sm font-medium truncate max-w-32">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-md"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {t('auth.signOut')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-white hover:text-blue-300 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  {t('auth.signIn')}
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md"
                >
                  {t('auth.signUp')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 text-base font-medium"
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}

            {status === 'authenticated' && (
              <>
                <div className="border-t border-white/10 my-3"></div>
                {authenticatedLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:text-blue-300 hover:bg-white/10 px-3 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 text-base font-medium"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                
                {session?.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:text-red-300 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 px-3 py-3 rounded-lg border border-red-500/30 transition-all duration-200 flex items-center gap-3 text-base font-medium"
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                    {t('nav.admin')}
                  </Link>
                )}

                <div className="border-t border-white/10 mt-3 pt-3">
                  <div className="flex items-center space-x-3 px-3 py-2 mb-3 bg-white/10 rounded-lg">
                    <UserIcon className="h-5 w-5 text-blue-300" />
                    <span className="text-white text-base font-medium">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' })
                      setMobileMenuOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-3 rounded-lg transition-all duration-200 text-base font-medium flex items-center justify-center gap-3 shadow-md"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    {t('auth.signOut')}
                  </button>
                </div>
              </>
            )}

            {status !== 'authenticated' && status !== 'loading' && (
              <>
                <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-white hover:text-blue-300 transition-colors text-base font-medium px-3 py-3 rounded-lg hover:bg-white/10 flex justify-center"
                  >
                    {t('auth.signIn')}
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-3 rounded-lg transition-all duration-200 text-base font-medium shadow-md flex justify-center"
                  >
                    {t('auth.signUp')}
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}