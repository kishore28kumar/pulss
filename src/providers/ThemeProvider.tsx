import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, THEME_PRESETS, applyTheme } from '@/lib/themes'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: ThemeConfig
  mode: ThemeMode
  setTheme: (theme: ThemeConfig) => void
  setMode: (mode: ThemeMode) => void
  customColors?: Record<string, string>
  setCustomColors: (colors: Record<string, string>) => void
  brandingConfig: BrandingConfig
  setBrandingConfig: (config: BrandingConfig) => void
}

interface BrandingConfig {
  logo?: string
  favicon?: string
  primaryFont?: string
  secondaryFont?: string
  customCSS?: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeConfig
  defaultMode?: ThemeMode
  storageKey?: string
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = THEME_PRESETS[0],
  defaultMode = 'system',
  storageKey = 'pulss-theme'
}) => {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme)
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)
  const [customColors, setCustomColorsState] = useState<Record<string, string>>({})
  const [brandingConfig, setBrandingConfigState] = useState<BrandingConfig>({})

  // Load saved theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.themeId) {
          const savedTheme = THEME_PRESETS.find(t => t.id === parsed.themeId)
          if (savedTheme) setThemeState(savedTheme)
        }
        if (parsed.mode) setModeState(parsed.mode)
        if (parsed.customColors) setCustomColorsState(parsed.customColors)
        if (parsed.branding) setBrandingConfigState(parsed.branding)
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  }, [storageKey])

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme)
    
    // Apply custom color overrides
    if (customColors && Object.keys(customColors).length > 0) {
      const root = document.documentElement
      Object.entries(customColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    }
  }, [theme, customColors])

  // Handle dark/light mode
  useEffect(() => {
    const root = document.documentElement
    
    const applyMode = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyMode(mediaQuery.matches)
      
      const listener = (e: MediaQueryListEvent) => applyMode(e.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    } else {
      applyMode(mode === 'dark')
    }
  }, [mode])

  // Apply custom fonts
  useEffect(() => {
    if (brandingConfig.primaryFont || brandingConfig.secondaryFont) {
      const root = document.documentElement
      if (brandingConfig.primaryFont) {
        root.style.setProperty('--font-primary', brandingConfig.primaryFont)
      }
      if (brandingConfig.secondaryFont) {
        root.style.setProperty('--font-secondary', brandingConfig.secondaryFont)
      }
    }
  }, [brandingConfig])

  // Apply custom CSS
  useEffect(() => {
    if (brandingConfig.customCSS) {
      const styleId = 'custom-branding-styles'
      let styleEl = document.getElementById(styleId) as HTMLStyleElement
      
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = styleId
        document.head.appendChild(styleEl)
      }
      
      styleEl.textContent = brandingConfig.customCSS
    }
  }, [brandingConfig.customCSS])

  // Apply favicon
  useEffect(() => {
    if (brandingConfig.favicon) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = brandingConfig.favicon
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }, [brandingConfig.favicon])

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      localStorage.setItem(storageKey, JSON.stringify({
        ...saved,
        themeId: newTheme.id
      }))
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      localStorage.setItem(storageKey, JSON.stringify({
        ...saved,
        mode: newMode
      }))
    } catch (error) {
      console.error('Failed to save mode:', error)
    }
  }

  const setCustomColors = (colors: Record<string, string>) => {
    setCustomColorsState(colors)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      localStorage.setItem(storageKey, JSON.stringify({
        ...saved,
        customColors: colors
      }))
    } catch (error) {
      console.error('Failed to save custom colors:', error)
    }
  }

  const setBrandingConfig = (config: BrandingConfig) => {
    setBrandingConfigState(config)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      localStorage.setItem(storageKey, JSON.stringify({
        ...saved,
        branding: config
      }))
    } catch (error) {
      console.error('Failed to save branding config:', error)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        customColors,
        setCustomColors,
        brandingConfig,
        setBrandingConfig
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
