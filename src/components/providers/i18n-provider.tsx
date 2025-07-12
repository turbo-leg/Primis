'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'mn'

interface Translation {
  [key: string]: any
}

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: Translation
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translations, setTranslations] = useState<Translation>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'mn')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  useEffect(() => {
    loadTranslations(language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const loadTranslations = async (lang: Language) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/locales/${lang}.json`)
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Loaded ${lang} translations with keys:`, Object.keys(data))
        setTranslations(data)
      } else {
        console.error(`❌ Failed to load translations for ${lang}: ${response.status}`)
        // Fallback to English if Mongolian fails
        if (lang === 'mn') {
          console.log('🔄 Falling back to English translations...')
          const fallbackResponse = await fetch('/locales/en.json')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            setTranslations(fallbackData)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error loading translations for ${lang}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const t = (key: string): string => {
    if (!translations || Object.keys(translations).length === 0) {
      // Show a more user-friendly fallback during loading
      return key.split('.').pop() || key
    }
    
    const keys = key.split('.')
    let current: any = translations
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        console.warn(`Translation key not found: ${key} for language: ${language}`)
        // Return the last part of the key as fallback
        return key.split('.').pop() || key
      }
    }
    
    return typeof current === 'string' ? current : key
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
