import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Type,
  Palette,
  Volume2,
  MousePointer,
  Zap,
  Monitor,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface AccessibilitySettings {
  // Visual Settings
  highContrast: boolean
  darkMode: boolean
  fontSize: number // 0.8 to 1.5
  fontWeight: 'normal' | 'bold'
  lineHeight: number // 1.2 to 2.0
  letterSpacing: number // 0 to 3px
  
  // Color Settings
  colorTheme: 'default' | 'high-contrast' | 'monochrome' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  reducedMotion: boolean
  
  // Interaction Settings
  focusIndicators: boolean
  clickDelay: number // 0 to 1000ms
  hoverDelay: number // 0 to 500ms
  doubleClickSpeed: number // 200 to 800ms
  
  // Audio Settings
  soundEffects: boolean
  screenReaderOptimized: boolean
  keyboardNavigation: boolean
  
  // Advanced Settings
  skipToContent: boolean
  headingNavigation: boolean
  landmarkNavigation: boolean
  autoReadContent: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  darkMode: false,
  fontSize: 1.0,
  fontWeight: 'normal',
  lineHeight: 1.5,
  letterSpacing: 0,
  colorTheme: 'default',
  reducedMotion: false,
  focusIndicators: true,
  clickDelay: 0,
  hoverDelay: 200,
  doubleClickSpeed: 400,
  soundEffects: false,
  screenReaderOptimized: false,
  keyboardNavigation: true,
  skipToContent: true,
  headingNavigation: true,
  landmarkNavigation: true,
  autoReadContent: false
}

const COLOR_THEMES = {
  'default': { 
    name: 'Default', 
    description: 'Standard color scheme',
    wcag: 'AA'
  },
  'high-contrast': { 
    name: 'High Contrast', 
    description: 'Black and white with high contrast ratios',
    wcag: 'AAA'
  },
  'monochrome': { 
    name: 'Monochrome', 
    description: 'Grayscale only',
    wcag: 'AAA'
  },
  'protanopia': { 
    name: 'Protanopia Friendly', 
    description: 'Adjusted for red-green color blindness',
    wcag: 'AA'
  },
  'deuteranopia': { 
    name: 'Deuteranopia Friendly', 
    description: 'Adjusted for green color blindness',
    wcag: 'AA'
  },
  'tritanopia': { 
    name: 'Tritanopia Friendly', 
    description: 'Adjusted for blue-yellow color blindness',
    wcag: 'AA'
  }
}

export const AccessibilitySettings: React.FC = () => {
  const [settings, setSettings] = useKV<AccessibilitySettings>('accessibility-settings', defaultSettings)
  const [previewMode, setPreviewMode] = useState(false)
  const [wcagScore, setWcagScore] = useState<{ level: 'A' | 'AA' | 'AAA', score: number }>({ level: 'AA', score: 85 })

  useEffect(() => {
    applyAccessibilitySettings()
    calculateWCAGScore()
  }, [settings])

  const applyAccessibilitySettings = () => {
    if (!settings) return

    const root = document.documentElement

    // Apply font settings
    root.style.setProperty('--accessibility-font-size', `${settings.fontSize}rem`)
    root.style.setProperty('--accessibility-font-weight', settings.fontWeight)
    root.style.setProperty('--accessibility-line-height', settings.lineHeight.toString())
    root.style.setProperty('--accessibility-letter-spacing', `${settings.letterSpacing}px`)

    // Apply color theme
    root.setAttribute('data-accessibility-theme', settings.colorTheme)
    
    // Apply contrast mode
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast')
    } else {
      root.classList.remove('accessibility-high-contrast')
    }

    // Apply dark mode
    if (settings.darkMode) {
      root.classList.add('accessibility-dark')
    } else {
      root.classList.remove('accessibility-dark')
    }

    // Apply motion reduction
    if (settings.reducedMotion) {
      root.style.setProperty('--accessibility-animation-duration', '0s')
      root.style.setProperty('--accessibility-transition-duration', '0s')
    } else {
      root.style.removeProperty('--accessibility-animation-duration')
      root.style.removeProperty('--accessibility-transition-duration')
    }

    // Apply interaction settings
    root.style.setProperty('--accessibility-click-delay', `${settings.clickDelay}ms`)
    root.style.setProperty('--accessibility-hover-delay', `${settings.hoverDelay}ms`)

    // Apply focus indicators
    if (settings.focusIndicators) {
      root.classList.add('accessibility-focus-indicators')
    } else {
      root.classList.remove('accessibility-focus-indicators')
    }
  }

  const calculateWCAGScore = () => {
    if (!settings) return

    let score = 0
    let maxScore = 0

    // Font size (10 points)
    maxScore += 10
    if (settings.fontSize >= 1.2) score += 10
    else if (settings.fontSize >= 1.1) score += 7
    else if (settings.fontSize >= 1.0) score += 5

    // Contrast (20 points)
    maxScore += 20
    if (settings.highContrast) score += 20
    else if (settings.colorTheme === 'high-contrast') score += 18
    else if (settings.colorTheme !== 'default') score += 12
    else score += 10

    // Keyboard navigation (15 points)
    maxScore += 15
    if (settings.keyboardNavigation) score += 15

    // Focus indicators (15 points)
    maxScore += 15
    if (settings.focusIndicators) score += 15

    // Screen reader optimization (15 points)
    maxScore += 15
    if (settings.screenReaderOptimized) score += 15

    // Skip to content (10 points)
    maxScore += 10
    if (settings.skipToContent) score += 10

    // Heading navigation (10 points)
    maxScore += 10
    if (settings.headingNavigation) score += 10

    // Reduced motion (5 points)
    maxScore += 5
    if (settings.reducedMotion) score += 5

    const percentage = Math.round((score / maxScore) * 100)
    let level: 'A' | 'AA' | 'AAA' = 'A'
    
    if (percentage >= 90) level = 'AAA'
    else if (percentage >= 70) level = 'AA'

    setWcagScore({ level, score: percentage })
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    toast.success('Accessibility settings reset to defaults')
  }

  const togglePreview = () => {
    setPreviewMode(!previewMode)
    if (!previewMode) {
      toast.info('Preview mode enabled - settings applied temporarily')
    } else {
      toast.info('Preview mode disabled')
    }
  }

  const getWCAGLevelColor = (level: string) => {
    switch (level) {
      case 'AAA': return 'bg-green-100 text-green-800'
      case 'AA': return 'bg-blue-100 text-blue-800'
      case 'A': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Settings</h1>
          <p className="text-muted-foreground">
            Customize your experience for better accessibility and usability
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* WCAG Compliance Score */}
          <div className="text-center">
            <Badge className={getWCAGLevelColor(wcagScore.level)} variant="secondary">
              WCAG {wcagScore.level}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {wcagScore.score}% compliant
            </p>
          </div>

          <Button onClick={togglePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview Mode'}
          </Button>
          
          <Button onClick={resetToDefaults} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => {
                updateSetting('highContrast', true)
                updateSetting('fontSize', 1.2)
                updateSetting('focusIndicators', true)
                toast.success('Vision-friendly settings applied')
              }}
            >
              <Eye className="h-6 w-6 mb-2" />
              <span>Vision Friendly</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => {
                updateSetting('keyboardNavigation', true)
                updateSetting('focusIndicators', true)
                updateSetting('skipToContent', true)
                updateSetting('headingNavigation', true)
                toast.success('Motor-friendly settings applied')
              }}
            >
              <MousePointer className="h-6 w-6 mb-2" />
              <span>Motor Friendly</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => {
                updateSetting('screenReaderOptimized', true)
                updateSetting('keyboardNavigation', true)
                updateSetting('skipToContent', true)
                updateSetting('landmarkNavigation', true)
                updateSetting('headingNavigation', true)
                toast.success('Screen reader settings applied')
              }}
            >
              <Volume2 className="h-6 w-6 mb-2" />
              <span>Screen Reader</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visual Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Font Size</Label>
                <Badge variant="outline">{Math.round(settings.fontSize * 100)}%</Badge>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={0.8}
                max={1.5}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjust text size for better readability
              </p>
            </div>

            <Separator />

            {/* Font Weight */}
            <div>
              <Label htmlFor="font-weight" className="mb-3 block">Font Weight</Label>
              <Select
                value={settings.fontWeight}
                onValueChange={(value) => updateSetting('fontWeight', value as 'normal' | 'bold')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Line Height */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Line Spacing</Label>
                <Badge variant="outline">{settings.lineHeight}x</Badge>
              </div>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={([value]) => updateSetting('lineHeight', value)}
                min={1.2}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Letter Spacing */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Letter Spacing</Label>
                <Badge variant="outline">{settings.letterSpacing}px</Badge>
              </div>
              <Slider
                value={[settings.letterSpacing]}
                onValueChange={([value]) => updateSetting('letterSpacing', value)}
                min={0}
                max={3}
                step={0.5}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Visual Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduces eye strain in low light
                  </p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizes animations and transitions
                  </p>
                </div>
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color & Interaction Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color & Interaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Theme */}
            <div>
              <Label htmlFor="color-theme" className="mb-3 block">Color Theme</Label>
              <Select
                value={settings.colorTheme}
                onValueChange={(value) => updateSetting('colorTheme', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{theme.name}</span>
                        <Badge className={getWCAGLevelColor(theme.wcag)} variant="secondary">
                          {theme.wcag}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {COLOR_THEMES[settings.colorTheme].description}
              </p>
            </div>

            <Separator />

            {/* Interaction Delays */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Click Delay</Label>
                <Badge variant="outline">{settings.clickDelay}ms</Badge>
              </div>
              <Slider
                value={[settings.clickDelay]}
                onValueChange={([value]) => updateSetting('clickDelay', value)}
                min={0}
                max={1000}
                step={50}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prevent accidental clicks
              </p>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Hover Delay</Label>
                <Badge variant="outline">{settings.hoverDelay}ms</Badge>
              </div>
              <Slider
                value={[settings.hoverDelay]}
                onValueChange={([value]) => updateSetting('hoverDelay', value)}
                min={0}
                max={500}
                step={25}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Interaction Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enhanced Focus Indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Visible focus outlines for keyboard navigation
                  </p>
                </div>
                <Switch
                  checked={settings.focusIndicators}
                  onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Keyboard Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Navigate using keyboard only
                  </p>
                </div>
                <Switch
                  checked={settings.keyboardNavigation}
                  onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Audio feedback for interactions
                  </p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screen Reader Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Screen Reader & Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Screen Reader Optimized</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize content for screen readers
                </p>
              </div>
              <Switch
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Skip to Content</Label>
                <p className="text-sm text-muted-foreground">
                  Show skip links for main content
                </p>
              </div>
              <Switch
                checked={settings.skipToContent}
                onCheckedChange={(checked) => updateSetting('skipToContent', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Heading Navigation</Label>
                <p className="text-sm text-muted-foreground">
                  Navigate by headings (H1, H2, etc.)
                </p>
              </div>
              <Switch
                checked={settings.headingNavigation}
                onCheckedChange={(checked) => updateSetting('headingNavigation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Landmark Navigation</Label>
                <p className="text-sm text-muted-foreground">
                  Navigate by page landmarks
                </p>
              </div>
              <Switch
                checked={settings.landmarkNavigation}
                onCheckedChange={(checked) => updateSetting('landmarkNavigation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-read Content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically read new content
                </p>
              </div>
              <Switch
                checked={settings.autoReadContent}
                onCheckedChange={(checked) => updateSetting('autoReadContent', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Accessibility Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getWCAGLevelColor(wcagScore.level)}`}>
                <span className="text-2xl font-bold">WCAG {wcagScore.level}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{wcagScore.score}%</p>
              <p className="text-muted-foreground">Accessibility Compliant</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Visual Accessibility</span>
                <Badge variant="outline">
                  {settings.highContrast || settings.fontSize >= 1.1 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Keyboard Navigation</span>
                <Badge variant="outline">
                  {settings.keyboardNavigation && settings.focusIndicators ? 'Excellent' : 'Limited'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Screen Reader Support</span>
                <Badge variant="outline">
                  {settings.screenReaderOptimized ? 'Full' : 'Basic'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Motor Accessibility</span>
                <Badge variant="outline">
                  {settings.clickDelay > 0 || settings.hoverDelay > 100 ? 'Enhanced' : 'Standard'}
                </Badge>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Accessibility Tips:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Use keyboard shortcuts: Tab to navigate, Enter to activate</li>
                    <li>• Screen reader users can navigate by headings with H key</li>
                    <li>• All images have descriptive alt text</li>
                    <li>• Color is not the only way information is conveyed</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Preview Mode Active</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your accessibility settings are being previewed. Navigate around the page to test your changes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Font Size:</span>
                  <span>{Math.round(settings.fontSize * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>High Contrast:</span>
                  <span>{settings.highContrast ? 'On' : 'Off'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Reduced Motion:</span>
                  <span>{settings.reducedMotion ? 'On' : 'Off'}</span>
                </div>
              </div>
              <Button onClick={togglePreview} className="w-full">
                Exit Preview Mode
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default AccessibilitySettings