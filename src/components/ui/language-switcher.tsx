'use client'

import { useTranslation } from '@/components/providers/i18n-provider'
import { LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'mn', name: 'Mongolian', flag: '🇲🇳', nativeName: 'Монгол' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white border border-white/20 hover:border-white/30"
        title={`Switch Language - Current: ${currentLanguage?.name}`}
      >
        <LanguageIcon className="h-4 w-4" />
        <span className="text-sm font-medium flex items-center gap-1">
          <span className="text-base">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline">{currentLanguage?.code.toUpperCase()}</span>
        </span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as 'en' | 'mn')
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/20 transition-all duration-200 flex items-center gap-3 ${
                  language === lang.code 
                    ? 'bg-white/20 text-blue-300' 
                    : 'text-white hover:text-blue-300'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{lang.name}</div>
                  <div className="text-xs opacity-75">{lang.nativeName}</div>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
