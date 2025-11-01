// Localization context and utilities for DPDP Act 2023 Privacy Features
import React, { createContext, useContext, useState, useEffect } from 'react'
import { enTranslations, type Translations } from './en'
import { hiTranslations } from './hi'

type Language = 'en' | 'hi'

interface LocaleContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en: enTranslations,
  hi: hiTranslations
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language preference
    const saved = localStorage.getItem('language')
    return (saved === 'en' || saved === 'hi') ? saved : 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language
  }, [language])

  const value = {
    language,
    setLanguage,
    t: translations[language]
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}

// Helper to check if browser prefers Hindi
export const getPreferredLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('hi')) {
    return 'hi'
  }
  return 'en'
}
