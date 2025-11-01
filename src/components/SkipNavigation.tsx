import React from 'react'
import { useTranslation } from 'react-i18next'

export function SkipNavigation() {
  const { t } = useTranslation()
  
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-[9999] bg-primary text-primary-foreground px-4 py-2 m-2 rounded-md focus:ring-2 focus:ring-ring focus:outline-none"
      >
        {t('navigation.skipToMain')}
      </a>
    </div>
  )
}
