// Theme configurations for universal customization

export interface ThemeConfig {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    card: string
    border: string
    muted: string
  }
  businessTypes: string[] // Which business types this theme suits
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'medical',
    name: 'Medical Professional',
    description: 'Clean, trustworthy healthcare theme',
    colors: {
      primary: 'oklch(0.47 0.13 264)', // Medical blue
      secondary: 'oklch(0.97 0.01 264)',
      accent: 'oklch(0.55 0.15 142)', // Health green
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 264)',
      muted: 'oklch(0.97 0.01 264)'
    },
    businessTypes: ['pharmacy']
  },
  {
    id: 'grocery',
    name: 'Fresh & Natural',
    description: 'Vibrant green theme for groceries',
    colors: {
      primary: 'oklch(0.55 0.15 142)', // Fresh green
      secondary: 'oklch(0.97 0.05 142)',
      accent: 'oklch(0.65 0.18 85)', // Orange accent
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.02 142)',
      muted: 'oklch(0.97 0.02 142)'
    },
    businessTypes: ['grocery']
  },
  {
    id: 'fashion',
    name: 'Elegant Fashion',
    description: 'Sophisticated theme for fashion stores',
    colors: {
      primary: 'oklch(0.35 0.12 320)', // Fashion purple
      secondary: 'oklch(0.97 0.02 320)',
      accent: 'oklch(0.72 0.15 35)', // Gold accent
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 320)',
      muted: 'oklch(0.97 0.01 320)'
    },
    businessTypes: ['fashion']
  },
  {
    id: 'tech',
    name: 'Modern Tech',
    description: 'Sleek theme for electronics',
    colors: {
      primary: 'oklch(0.45 0.15 240)', // Tech blue
      secondary: 'oklch(0.96 0.02 240)',
      accent: 'oklch(0.65 0.20 320)', // Electric purple
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 240)',
      muted: 'oklch(0.96 0.01 240)'
    },
    businessTypes: ['electronics']
  },
  {
    id: 'premium',
    name: 'Premium Gold',
    description: 'Luxurious gold and black theme',
    colors: {
      primary: 'oklch(0.25 0.05 264)', // Premium black
      secondary: 'oklch(0.95 0.01 50)',
      accent: 'oklch(0.72 0.15 85)', // Premium gold
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.90 0.01 50)',
      muted: 'oklch(0.95 0.01 50)'
    },
    businessTypes: ['fashion', 'electronics', 'general']
  },
  {
    id: 'warm',
    name: 'Warm Earth',
    description: 'Warm, welcoming earth tones',
    colors: {
      primary: 'oklch(0.52 0.12 50)', // Warm brown
      secondary: 'oklch(0.96 0.02 50)',
      accent: 'oklch(0.65 0.15 25)', // Warm orange
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 50)',
      muted: 'oklch(0.96 0.01 50)'
    },
    businessTypes: ['grocery', 'general']
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calming ocean-inspired theme',
    colors: {
      primary: 'oklch(0.55 0.15 220)', // Ocean blue
      secondary: 'oklch(0.97 0.02 220)',
      accent: 'oklch(0.75 0.12 180)', // Aqua accent
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 220)',
      muted: 'oklch(0.97 0.01 220)'
    },
    businessTypes: ['pharmacy', 'general']
  },
  {
    id: 'sunset',
    name: 'Sunset Vibes',
    description: 'Vibrant sunset gradient theme',
    colors: {
      primary: 'oklch(0.62 0.18 25)', // Sunset orange
      secondary: 'oklch(0.96 0.03 25)',
      accent: 'oklch(0.55 0.20 350)', // Pink accent
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.02 25)',
      muted: 'oklch(0.96 0.02 25)'
    },
    businessTypes: ['fashion', 'general']
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural forest-inspired theme',
    colors: {
      primary: 'oklch(0.45 0.15 150)', // Forest green
      secondary: 'oklch(0.97 0.02 150)',
      accent: 'oklch(0.65 0.12 80)', // Natural yellow
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 150)',
      muted: 'oklch(0.97 0.01 150)'
    },
    businessTypes: ['grocery', 'pharmacy', 'general']
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    description: 'Majestic purple theme',
    colors: {
      primary: 'oklch(0.42 0.18 300)', // Royal purple
      secondary: 'oklch(0.97 0.02 300)',
      accent: 'oklch(0.72 0.15 60)', // Gold accent
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0 0)',
      card: 'oklch(1 0 0)',
      border: 'oklch(0.92 0.01 300)',
      muted: 'oklch(0.97 0.01 300)'
    },
    businessTypes: ['fashion', 'electronics', 'general']
  }
]

export const getThemeById = (themeId: string): ThemeConfig => {
  return THEME_PRESETS.find(theme => theme.id === themeId) || THEME_PRESETS[0]
}

export const getThemesForBusinessType = (businessType: string): ThemeConfig[] => {
  return THEME_PRESETS.filter(theme => 
    theme.businessTypes.includes(businessType) || theme.businessTypes.includes('general')
  )
}

export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key.replace('_', '-')}`, value)
  })
}