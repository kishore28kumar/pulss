/**
 * White-Label Theme Configurations
 * 
 * This file contains pre-configured themes for different business types
 * and branding scenarios. These can be used as starting points for
 * white-label deployments.
 */

import { ThemeConfig } from './themes'

export interface WhiteLabelConfig {
  id: string
  name: string
  description: string
  theme: ThemeConfig
  branding: {
    logo?: string
    favicon?: string
    primaryFont?: string
    secondaryFont?: string
  }
  businessType: string
  industry: string
}

export const WHITE_LABEL_CONFIGS: WhiteLabelConfig[] = [
  {
    id: 'healthcare-pro',
    name: 'Healthcare Professional',
    description: 'Clean, trustworthy theme for medical and healthcare businesses',
    businessType: 'pharmacy',
    industry: 'healthcare',
    theme: {
      id: 'healthcare-pro',
      name: 'Healthcare Professional',
      description: 'Medical-grade professional theme',
      colors: {
        primary: 'oklch(0.47 0.13 264)', // Medical blue
        secondary: 'oklch(0.97 0.01 264)',
        accent: 'oklch(0.55 0.15 142)', // Health green
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0 0)',
        border: 'oklch(0.92 0.01 264)',
        muted: 'oklch(0.97 0.01 264)'
      },
      businessTypes: ['pharmacy', 'healthcare']
    },
    branding: {
      primaryFont: "'Inter', -apple-system, sans-serif",
      secondaryFont: "'Inter', sans-serif"
    }
  },
  {
    id: 'fresh-market',
    name: 'Fresh Market',
    description: 'Vibrant, natural theme for grocery and fresh produce stores',
    businessType: 'grocery',
    industry: 'retail',
    theme: {
      id: 'fresh-market',
      name: 'Fresh Market',
      description: 'Natural and vibrant grocery theme',
      colors: {
        primary: 'oklch(0.55 0.15 142)', // Fresh green
        secondary: 'oklch(0.97 0.05 142)',
        accent: 'oklch(0.65 0.18 85)', // Orange accent
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.02 142)',
        border: 'oklch(0.92 0.02 142)',
        muted: 'oklch(0.97 0.02 142)'
      },
      businessTypes: ['grocery']
    },
    branding: {
      primaryFont: "'Poppins', sans-serif",
      secondaryFont: "'Open Sans', sans-serif"
    }
  },
  {
    id: 'luxury-boutique',
    name: 'Luxury Boutique',
    description: 'Elegant, premium theme for high-end fashion and lifestyle stores',
    businessType: 'fashion',
    industry: 'retail',
    theme: {
      id: 'luxury-boutique',
      name: 'Luxury Boutique',
      description: 'Premium fashion and lifestyle theme',
      colors: {
        primary: 'oklch(0.25 0.05 264)', // Luxury black
        secondary: 'oklch(0.95 0.01 50)',
        accent: 'oklch(0.72 0.15 85)', // Premium gold
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0 0)',
        border: 'oklch(0.90 0.01 50)',
        muted: 'oklch(0.95 0.01 50)'
      },
      businessTypes: ['fashion']
    },
    branding: {
      primaryFont: "'Playfair Display', serif",
      secondaryFont: "'Source Sans Pro', sans-serif"
    }
  },
  {
    id: 'tech-hub',
    name: 'Tech Hub',
    description: 'Modern, sleek theme for electronics and technology stores',
    businessType: 'electronics',
    industry: 'technology',
    theme: {
      id: 'tech-hub',
      name: 'Tech Hub',
      description: 'Cutting-edge technology theme',
      colors: {
        primary: 'oklch(0.45 0.15 240)', // Tech blue
        secondary: 'oklch(0.96 0.02 240)',
        accent: 'oklch(0.65 0.20 320)', // Electric purple
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 240)',
        border: 'oklch(0.92 0.01 240)',
        muted: 'oklch(0.96 0.01 240)'
      },
      businessTypes: ['electronics']
    },
    branding: {
      primaryFont: "'Roboto', sans-serif",
      secondaryFont: "'Roboto', sans-serif"
    }
  },
  {
    id: 'wellness-center',
    name: 'Wellness Center',
    description: 'Calming, natural theme for wellness and health stores',
    businessType: 'pharmacy',
    industry: 'wellness',
    theme: {
      id: 'wellness-center',
      name: 'Wellness Center',
      description: 'Holistic wellness and natural health theme',
      colors: {
        primary: 'oklch(0.5 0.15 185)', // Teal wellness
        secondary: 'oklch(0.97 0.02 185)',
        accent: 'oklch(0.65 0.12 80)', // Natural yellow
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 185)',
        border: 'oklch(0.92 0.01 185)',
        muted: 'oklch(0.97 0.01 185)'
      },
      businessTypes: ['pharmacy', 'wellness']
    },
    branding: {
      primaryFont: "'Lato', sans-serif",
      secondaryFont: "'Lato', sans-serif"
    }
  },
  {
    id: 'neighborhood-store',
    name: 'Neighborhood Store',
    description: 'Warm, welcoming theme for local community stores',
    businessType: 'general',
    industry: 'retail',
    theme: {
      id: 'neighborhood-store',
      name: 'Neighborhood Store',
      description: 'Friendly local store theme',
      colors: {
        primary: 'oklch(0.52 0.12 50)', // Warm brown
        secondary: 'oklch(0.96 0.02 50)',
        accent: 'oklch(0.65 0.15 25)', // Warm orange
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 50)',
        border: 'oklch(0.92 0.01 50)',
        muted: 'oklch(0.96 0.01 50)'
      },
      businessTypes: ['general', 'grocery']
    },
    branding: {
      primaryFont: "'Raleway', sans-serif",
      secondaryFont: "'Lato', sans-serif"
    }
  },
  {
    id: 'beauty-salon',
    name: 'Beauty & Cosmetics',
    description: 'Elegant pink theme for beauty and cosmetics stores',
    businessType: 'fashion',
    industry: 'beauty',
    theme: {
      id: 'beauty-salon',
      name: 'Beauty & Cosmetics',
      description: 'Chic beauty and cosmetics theme',
      colors: {
        primary: 'oklch(0.6 0.15 330)', // Pink beauty
        secondary: 'oklch(0.97 0.02 330)',
        accent: 'oklch(0.7 0.15 350)', // Rose accent
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 330)',
        border: 'oklch(0.92 0.01 330)',
        muted: 'oklch(0.97 0.01 330)'
      },
      businessTypes: ['fashion', 'beauty']
    },
    branding: {
      primaryFont: "'Montserrat', sans-serif",
      secondaryFont: "'Open Sans', sans-serif"
    }
  },
  {
    id: 'organic-natural',
    name: 'Organic & Natural',
    description: 'Earthy, sustainable theme for organic and eco-friendly stores',
    businessType: 'grocery',
    industry: 'organic',
    theme: {
      id: 'organic-natural',
      name: 'Organic & Natural',
      description: 'Sustainable organic theme',
      colors: {
        primary: 'oklch(0.45 0.15 150)', // Forest green
        secondary: 'oklch(0.97 0.02 150)',
        accent: 'oklch(0.65 0.12 80)', // Natural yellow
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 150)',
        border: 'oklch(0.92 0.01 150)',
        muted: 'oklch(0.97 0.01 150)'
      },
      businessTypes: ['grocery', 'organic']
    },
    branding: {
      primaryFont: "'Merriweather', serif",
      secondaryFont: "'Lato', sans-serif"
    }
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    description: 'Energetic, dynamic theme for sports and fitness stores',
    businessType: 'general',
    industry: 'sports',
    theme: {
      id: 'sports-fitness',
      name: 'Sports & Fitness',
      description: 'Dynamic sports and fitness theme',
      colors: {
        primary: 'oklch(0.55 0.2 25)', // Energetic orange
        secondary: 'oklch(0.96 0.03 25)',
        accent: 'oklch(0.45 0.15 240)', // Athletic blue
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.02 25)',
        border: 'oklch(0.92 0.02 25)',
        muted: 'oklch(0.96 0.02 25)'
      },
      businessTypes: ['general', 'sports']
    },
    branding: {
      primaryFont: "'Oswald', sans-serif",
      secondaryFont: "'Roboto', sans-serif"
    }
  },
  {
    id: 'artisan-craft',
    name: 'Artisan & Craft',
    description: 'Creative, handmade theme for artisan and craft stores',
    businessType: 'general',
    industry: 'crafts',
    theme: {
      id: 'artisan-craft',
      name: 'Artisan & Craft',
      description: 'Creative artisan theme',
      colors: {
        primary: 'oklch(0.42 0.18 300)', // Creative purple
        secondary: 'oklch(0.97 0.02 300)',
        accent: 'oklch(0.72 0.15 60)', // Warm gold
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.15 0 0)',
        card: 'oklch(0.99 0.01 300)',
        border: 'oklch(0.92 0.01 300)',
        muted: 'oklch(0.97 0.01 300)'
      },
      businessTypes: ['general', 'crafts']
    },
    branding: {
      primaryFont: "'Libre Baskerville', serif",
      secondaryFont: "'Lato', sans-serif"
    }
  }
]

export const getWhiteLabelConfig = (id: string): WhiteLabelConfig | undefined => {
  return WHITE_LABEL_CONFIGS.find(config => config.id === id)
}

export const getWhiteLabelsByBusinessType = (businessType: string): WhiteLabelConfig[] => {
  return WHITE_LABEL_CONFIGS.filter(config => config.businessType === businessType)
}

export const getWhiteLabelsByIndustry = (industry: string): WhiteLabelConfig[] => {
  return WHITE_LABEL_CONFIGS.filter(config => config.industry === industry)
}
