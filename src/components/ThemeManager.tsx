import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Palette, Check, Sun, Moon, Sparkle } from '@phosphor-icons/react'

interface Theme {
  id: string
  name: string
  type: 'system' | 'custom'
  is_active: boolean
  color_scheme: {
    background: string
    foreground: string
    primary: string
    secondary: string
    accent: string
    muted: string
    destructive: string
    border: string
  }
}

interface ThemeManagerProps {
  isSuperAdmin?: boolean
  currentThemeId?: string
  onThemeChange?: (themeId: string) => void
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({
  isSuperAdmin = false,
  currentThemeId,
  onThemeChange
}) => {
  const queryClient = useQueryClient()
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId || 'theme-light-default')

  // Fetch available themes
  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name')
      
      if (error) throw error
      return data as Theme[]
    }
  })

  // Apply theme
  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const theme = themes.find(t => t.id === themeId)
      if (!theme) throw new Error('Theme not found')

      // Apply CSS custom properties to document root
      const root = document.documentElement
      Object.entries(theme.color_scheme).forEach(([key, value]) => {
        root.style.setProperty(`--${key.replace('_', '-')}`, value)
      })

      if (onThemeChange) {
        onThemeChange(themeId)
      }

      return theme
    },
    onSuccess: (theme) => {
      setSelectedTheme(theme.id)
      toast.success(`Applied ${theme.name} theme`)
    },
    onError: (error) => {
      toast.error(`Failed to apply theme: ${error.message}`)
    }
  })

  // Create new theme (Super Admin only)
  const createThemeMutation = useMutation({
    mutationFn: async (newTheme: Partial<Theme>) => {
      const { data, error } = await supabase
        .from('themes')
        .insert([newTheme])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] })
      toast.success('Theme created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create theme: ${error.message}`)
    }
  })

  const handleThemeSelect = (themeId: string) => {
    applyThemeMutation.mutate(themeId)
  }

  const getThemePreview = (theme: Theme) => {
    const colors = theme.color_scheme
    return (
      <div className="flex space-x-1 mb-2">
        <div 
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.secondary }}
        />
      </div>
    )
  }

  const systemThemes = themes.filter(t => t.type === 'system')
  const customThemes = themes.filter(t => t.type === 'custom')

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette />
          Theme Settings
        </CardTitle>
        <CardDescription>
          {isSuperAdmin 
            ? "Manage themes for all tenants. Create custom themes or use system defaults."
            : "Choose between light and dark modes for your interface."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* System Themes (Light/Dark for regular users) */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4" />
            System Themes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {systemThemes.map((theme) => (
              <div
                key={theme.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTheme === theme.id 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {getThemePreview(theme)}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{theme.name}</span>
                  {selectedTheme === theme.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Themes (Super Admin only) */}
        {isSuperAdmin && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkle className="w-4 h-4" />
              Custom Themes
              <Badge variant="outline" className="ml-auto">Super Admin</Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedTheme === theme.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  {getThemePreview(theme)}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{theme.name}</span>
                    {selectedTheme === theme.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={() => handleThemeSelect(selectedTheme)}
            disabled={applyThemeMutation.isPending}
            className="w-full md:w-auto"
          >
            {applyThemeMutation.isPending ? 'Applying...' : 'Apply Theme'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}