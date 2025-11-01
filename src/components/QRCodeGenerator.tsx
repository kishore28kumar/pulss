import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import { Download, QrCode, Copy, Eye, Palette, Globe, Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  tenants: Array<{
    id: string
    name: string
    admin_email: string
    business_type: string
    logo_url?: string
  }>
}

interface QRCodeTemplate {
  id: string
  name: string
  size: number
  colors: {
    foreground: string
    background: string
  }
  logo: boolean
  margin: number
}

const QR_TEMPLATES: QRCodeTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    size: 200,
    colors: { foreground: '#000000', background: '#FFFFFF' },
    logo: false,
    margin: 4
  },
  {
    id: 'branded',
    name: 'Branded',
    size: 250,
    colors: { foreground: '#6366F1', background: '#FFFFFF' },
    logo: true,
    margin: 4
  },
  {
    id: 'modern',
    name: 'Modern',
    size: 200,
    colors: { foreground: '#1F2937', background: '#F9FAFB' },
    logo: false,
    margin: 6
  },
  {
    id: 'colorful',
    name: 'Colorful',
    size: 200,
    colors: { foreground: '#10B981', background: '#ECFDF5' },
    logo: false,
    margin: 4
  }
]

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ tenants }) => {
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<QRCodeTemplate>(QR_TEMPLATES[0])
  const [customText, setCustomText] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrType, setQrType] = useState<'tenant' | 'custom'>('tenant')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const tenant = tenants.find(t => t.id === selectedTenant)

  const generateQRCode = async () => {
    if (!selectedTenant && qrType === 'tenant') {
      toast.error('Please select a tenant')
      return
    }

    if (!customText && qrType === 'custom') {
      toast.error('Please enter custom text')
      return
    }

    setIsGenerating(true)
    
    try {
      let qrText = ''
      
      if (qrType === 'tenant') {
        // Generate app download link for specific tenant
        const baseUrl = window.location.origin
        qrText = `${baseUrl}/?tenant=${selectedTenant}&ref=qr`
      } else {
        qrText = customText
      }

      const canvas = canvasRef.current
      if (!canvas) return

      await QRCode.toCanvas(canvas, qrText, {
        width: selectedTemplate.size,
        margin: selectedTemplate.margin,
        color: {
          dark: selectedTemplate.colors.foreground,
          light: selectedTemplate.colors.background,
        },
        errorCorrectionLevel: 'M'
      })

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png')
      setQrDataUrl(dataUrl)
      
      toast.success('QR Code generated successfully!')
    } catch (error) {
      console.error('QR generation error:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    const fileName = qrType === 'tenant' 
      ? `${tenant?.name || 'tenant'}-qr-code.png`
      : `custom-qr-code.png`
    
    link.download = fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`QR Code downloaded as ${link.download}`)
  }

  const copyQRCode = async () => {
    if (!qrDataUrl) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      
      toast.success('QR Code copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error)
      toast.error('Failed to copy QR code')
    }
  }

  const previewUrl = () => {
    if (qrType === 'tenant' && selectedTenant) {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/?tenant=${selectedTenant}&ref=qr`
      window.open(url, '_blank')
    } else if (qrType === 'custom' && customText) {
      // Try to open as URL if it's a valid URL
      try {
        new URL(customText)
        window.open(customText, '_blank')
      } catch {
        toast.info('Custom text is not a valid URL')
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode size={20} />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate QR codes for tenant app downloads or custom content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Type Selection */}
          <div>
            <Label>QR Code Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={qrType === 'tenant' ? 'default' : 'outline'}
                onClick={() => setQrType('tenant')}
                className="flex-1 gap-2"
              >
                <Storefront size={16} />
                Tenant App
              </Button>
              <Button
                variant={qrType === 'custom' ? 'default' : 'outline'}
                onClick={() => setQrType('custom')}
                className="flex-1 gap-2"
              >
                <Globe size={16} />
                Custom URL
              </Button>
            </div>
          </div>

          {/* Tenant Selection */}
          {qrType === 'tenant' && (
            <div>
              <Label htmlFor="tenant-select">Select Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger id="tenant-select">
                  <SelectValue placeholder="Choose a business..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {tenant.business_type}
                        </Badge>
                        {tenant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenant && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">{tenant.admin_email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    App URL: {window.location.origin}/?tenant={tenant.id}&ref=qr
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Text Input */}
          {qrType === 'custom' && (
            <div>
              <Label htmlFor="custom-text">Custom Text/URL</Label>
              <Textarea
                id="custom-text"
                placeholder="Enter any text or URL..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Template Selection */}
          <div>
            <Label>Design Template</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {QR_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate.id === template.id ? 'default' : 'outline'}
                  onClick={() => setSelectedTemplate(template)}
                  className="p-3 h-auto flex flex-col gap-1"
                >
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="flex gap-1">
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: template.colors.foreground }}
                    />
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: template.colors.background }}
                    />
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <Button 
              onClick={generateQRCode} 
              className="w-full gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode size={16} />
                  Generate QR Code
                </>
              )}
            </Button>

            {qrDataUrl && (
              <div className="flex gap-2">
                <Button 
                  onClick={downloadQRCode}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button 
                  onClick={copyQRCode}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Copy size={16} />
                  Copy
                </Button>
                <Button 
                  onClick={previewUrl}
                  variant="outline"
                  className="gap-2"
                >
                  <Eye size={16} />
                  Preview
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
          <CardDescription>
            {qrType === 'tenant' 
              ? 'Customers will scan this to access the tenant\'s store'
              : 'Generated QR code for custom content'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted">
            {qrDataUrl ? (
              <div className="text-center space-y-4">
                <canvas 
                  ref={canvasRef} 
                  className="border rounded-lg shadow-lg max-w-full"
                />
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {qrType === 'tenant' 
                      ? `${tenant?.name} - Store App`
                      : 'Custom QR Code'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Template: {selectedTemplate.name} • Size: {selectedTemplate.size}px
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Ready to use
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <QrCode size={48} className="text-muted-foreground mx-auto" />
                <div>
                  <div className="text-lg font-medium text-muted-foreground">No QR Code Generated</div>
                  <div className="text-sm text-muted-foreground">
                    Configure settings and click "Generate QR Code"
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}