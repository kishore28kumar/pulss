import React, { useState } from 'react'
import { useTheme } from '@/providers/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/ImageUpload'
import { toast } from 'sonner'
import {
  Image as ImageIcon,
  Palette,
  TextAa,
  Code,
  Check,
  Upload,
  Download
} from '@phosphor-icons/react'
import { THEME_PRESETS } from '@/lib/themes'

export const BrandingManager: React.FC = () => {
  const { brandingConfig, setBrandingConfig, setCustomColors, customColors, theme, setTheme } = useTheme()
  const [localConfig, setLocalConfig] = useState(brandingConfig)
  const [colorPalette, setColorPalette] = useState<Record<string, string>>(customColors || {})

  const handleLogoUpload = (url: string) => {
    setLocalConfig({ ...localConfig, logo: url })
  }

  const handleFaviconUpload = (url: string) => {
    setLocalConfig({ ...localConfig, favicon: url })
  }

  const handleSave = () => {
    setBrandingConfig(localConfig)
    setCustomColors(colorPalette)
    toast.success('Branding settings saved successfully!')
  }

  const handleExportConfig = () => {
    const config = {
      branding: localConfig,
      colors: colorPalette,
      theme: theme.id
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'branding-config.json'
    a.click()
    toast.success('Configuration exported!')
  }

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        if (config.branding) setLocalConfig(config.branding)
        if (config.colors) setColorPalette(config.colors)
        if (config.theme) {
          const theme = THEME_PRESETS.find(t => t.id === config.theme)
          if (theme) setTheme(theme)
        }
        toast.success('Configuration imported!')
      } catch (error) {
        toast.error('Invalid configuration file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding & White-Label Configuration</h2>
          <p className="text-muted-foreground">
            Customize your store's appearance, logos, colors, and fonts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportConfig}>
            <Download className="mr-2" />
            Export Config
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2" />
              Import Config
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportConfig}
              />
            </label>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logos">
            <ImageIcon className="mr-2" />
            Logos & Icons
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2" />
            Color Palette
          </TabsTrigger>
          <TabsTrigger value="fonts">
            <TextAa className="mr-2" />
            Fonts
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="mr-2" />
            Custom CSS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo Upload</CardTitle>
              <CardDescription>
                Upload your brand logo (recommended: PNG with transparent background, 300x100px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Main Logo</Label>
                <ImageUpload
                  onUpload={handleLogoUpload}
                  currentUrl={localConfig.logo}
                />
                {localConfig.logo && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm mb-2">Preview:</p>
                    <img
                      src={localConfig.logo}
                      alt="Logo preview"
                      className="max-h-20 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                Upload your favicon (recommended: ICO or PNG, 32x32px)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onUpload={handleFaviconUpload}
                currentUrl={localConfig.favicon}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Color Palette</CardTitle>
              <CardDescription>
                Override theme colors with your brand colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'primary', label: 'Primary Color', description: 'Main brand color' },
                { key: 'secondary', label: 'Secondary Color', description: 'Supporting color' },
                { key: 'accent', label: 'Accent Color', description: 'Highlight color' },
                { key: 'background', label: 'Background', description: 'Page background' },
                { key: 'foreground', label: 'Foreground', description: 'Text color' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor={key}>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id={key}
                      type="color"
                      className="w-16 h-10 cursor-pointer"
                      value={colorPalette[key] || theme.colors[key as keyof typeof theme.colors] || '#000000'}
                      onChange={(e) =>
                        setColorPalette({ ...colorPalette, [key]: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      className="w-32"
                      value={colorPalette[key] || ''}
                      placeholder="Custom value"
                      onChange={(e) =>
                        setColorPalette({ ...colorPalette, [key]: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>
                Customize fonts for your brand (use Google Fonts or system fonts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryFont">Primary Font</Label>
                <Input
                  id="primaryFont"
                  placeholder="e.g., 'Inter', sans-serif"
                  value={localConfig.primaryFont || ''}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, primaryFont: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Used for headings and important text
                </p>
              </div>
              <div>
                <Label htmlFor="secondaryFont">Secondary Font</Label>
                <Input
                  id="secondaryFont"
                  placeholder="e.g., 'Roboto', sans-serif"
                  value={localConfig.secondaryFont || ''}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, secondaryFont: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Used for body text and descriptions
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm mb-2">Popular Font Combinations:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Playfair Display + Source Sans Pro</li>
                  <li>• Montserrat + Open Sans</li>
                  <li>• Lora + Merriweather</li>
                  <li>• Raleway + Lato</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS for advanced styling (use with caution)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="/* Your custom CSS here */"
                className="font-mono min-h-[300px]"
                value={localConfig.customCSS || ''}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, customCSS: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-2">
                Example: Override specific component styles or add custom animations
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Check className="mr-2" />
          Save Branding Settings
        </Button>
      </div>
    </div>
  )
}
