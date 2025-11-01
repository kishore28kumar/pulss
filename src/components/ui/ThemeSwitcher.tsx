import React, { useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'
import { THEME_PRESETS } from '@/lib/themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor, Palette } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const ThemeSwitcher: React.FC = () => {
  const { theme, mode, setTheme, setMode } = useTheme()
  const [showThemePicker, setShowThemePicker] = useState(false)

  const modeIcons = {
    light: <Sun weight="fill" />,
    dark: <Moon weight="fill" />,
    system: <Monitor weight="fill" />
  }

  const handleThemeSelect = (selectedTheme: typeof THEME_PRESETS[0]) => {
    setTheme(selectedTheme)
    setShowThemePicker(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            {modeIcons[mode]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setMode('light')}>
            <Sun className="mr-2" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('dark')}>
            <Moon className="mr-2" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('system')}>
            <Monitor className="mr-2" />
            System
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowThemePicker(true)}>
            <Palette className="mr-2" />
            Choose Theme
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showThemePicker} onOpenChange={setShowThemePicker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEME_PRESETS.map((themeOption) => (
              <Card
                key={themeOption.id}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  theme.id === themeOption.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleThemeSelect(themeOption)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{themeOption.name}</h3>
                    {theme.id === themeOption.id && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {themeOption.description}
                  </p>
                  <div className="flex gap-2 mb-2">
                    {Object.entries(themeOption.colors)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: value }}
                          title={key}
                        />
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {themeOption.businessTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
