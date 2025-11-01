import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Globe } from '@phosphor-icons/react'
import { useLocale } from '@/locales'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe as LucideGlobe } from 'lucide-react'

// Variant 1: select/buttons style using useLocale (custom hook)
export const LanguageSwitcherSelect: React.FC<{ variant?: 'select' | 'buttons' }> = ({
  variant = 'select'
}) => {
  const { language, setLanguage } = useLocale()

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={language === 'en' ? 'default' : 'ghost'}
            onClick={() => setLanguage('en')}
            className="h-8 px-3"
          >
            English
          </Button>
          <Button
            size="sm"
            variant={language === 'hi' ? 'default' : 'ghost'}
            onClick={() => setLanguage('hi')}
            className="h-8 px-3"
          >
            हिंदी
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Variant 2: dropdown style using react-i18next
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
]

export function LanguageSwitcherDropdown() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Select language"
          className="gap-2"
        >
          <LucideGlobe className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Current language: </span>
          {currentLanguage.nativeName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
            aria-current={i18n.language === lang.code ? 'true' : undefined}
          >
            {lang.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}