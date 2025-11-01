import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { THEME_PRESETS, ThemeConfig, applyTheme } from '@/lib/themes'
import { Palette, Check } from '@phosphor-icons/react'

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (theme: ThemeConfig) => void
  selectedThemeId?: string
  businessType?: string
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedThemeId,
  businessType
}) => {
  const availableThemes = businessType 
    ? THEME_PRESETS.filter(theme => 
        theme.businessTypes.includes(businessType) || theme.businessTypes.includes('general')
      )
    : THEME_PRESETS

  const handleSelect = (theme: ThemeConfig) => {
    onSelect(theme)
    onClose()
  }

  const previewTheme = (theme: ThemeConfig) => {
    applyTheme(theme)
  }

  const resetTheme = () => {
    if (selectedThemeId) {
      const currentTheme = THEME_PRESETS.find(t => t.id === selectedThemeId)
      if (currentTheme) {
        applyTheme(currentTheme)
      }
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetTheme()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>Choose Theme</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select a visual theme for your store. Hover to preview, click to select.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {availableThemes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isSelected={selectedThemeId === theme.id}
              onClick={() => handleSelect(theme)}
              onPreview={() => previewTheme(theme)}
              businessType={businessType}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetTheme(); onClose(); }}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ThemePreviewCardProps {
  theme: ThemeConfig
  isSelected: boolean
  onClick: () => void
  onPreview: () => void
  businessType?: string
}

const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isSelected,
  onClick,
  onPreview,
  businessType
}) => {
  const isRecommended = businessType && theme.businessTypes.includes(businessType)

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg relative ${
        isSelected 
          ? 'ring-2 ring-primary border-primary' 
          : 'hover:border-primary/50'
      }`}
      onClick={onClick}
      onMouseEnter={onPreview}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
      
      {isRecommended && (
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-xs bg-green-100 text-green-700"
        >
          Recommended
        </Badge>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{theme.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{theme.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div 
              className="h-8 rounded border"
              style={{ backgroundColor: theme.colors.primary }}
              title="Primary Color"
            />
            <div 
              className="h-8 rounded border"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Secondary Color"
            />
            <div 
              className="h-8 rounded border"
              style={{ backgroundColor: theme.colors.accent }}
              title="Accent Color"
            />
            <div 
              className="h-8 rounded border"
              style={{ backgroundColor: theme.colors.muted }}
              title="Muted Color"
            />
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span>Primary actions & branding</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <span>Highlights & emphasis</span>
              </div>
            </div>
          </div>

          <div className="text-xs">
            <span className="font-medium">Best for: </span>
            <span className="text-muted-foreground">
              {theme.businessTypes.join(', ')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ThemeDisplayProps {
  theme: ThemeConfig
  showEditButton?: boolean
  onEdit?: () => void
}

export const ThemeDisplay: React.FC<ThemeDisplayProps> = ({
  theme,
  showEditButton = false,
  onEdit
}) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-card border rounded-lg">
      <div className="grid grid-cols-4 gap-1 w-16">
        <div 
          className="h-4 rounded-sm border"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="h-4 rounded-sm border"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="h-4 rounded-sm border"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div 
          className="h-4 rounded-sm border"
          style={{ backgroundColor: theme.colors.muted }}
        />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-lg">{theme.name}</h3>
          {showEditButton && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Change Theme
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {theme.description}
        </p>
      </div>
    </div>
  )
}