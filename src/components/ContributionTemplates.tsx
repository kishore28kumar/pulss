import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Copy, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ContributionTemplate {
  id: string
  name: string
  category: string
  description: string
  template_content: string
  created_at: string
  updated_at: string
}

interface ContributionTemplatesProps {
  apiUrl: string
  authToken: string
}

const TEMPLATE_CATEGORIES = [
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'code_contribution', label: 'Code Contribution' },
  { value: 'api_integration', label: 'API Integration' },
  { value: 'ui_improvement', label: 'UI Improvement' }
]

export const ContributionTemplates: React.FC<ContributionTemplatesProps> = ({
  apiUrl,
  authToken
}) => {
  const [templates, setTemplates] = useState<ContributionTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [templateContent, setTemplateContent] = useState('')

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/super-admin/contribution-templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied. Super admin only.')
          return
        }
        throw new Error('Failed to load templates')
      }

      const data = await response.json()
      setTemplates(data.data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  // Add template
  const addTemplate = async () => {
    try {
      if (!name || !category || !templateContent) {
        toast.error('Please fill all required fields')
        return
      }

      const response = await fetch(`${apiUrl}/super-admin/contribution-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          category,
          description,
          template_content: templateContent
        })
      })

      if (!response.ok) throw new Error('Failed to add template')

      toast.success('Template added successfully')
      
      // Reset form
      setName('')
      setCategory('')
      setDescription('')
      setTemplateContent('')
      setShowAddDialog(false)
      
      // Reload templates
      await loadTemplates()
    } catch (error) {
      console.error('Error adding template:', error)
      toast.error('Failed to add template')
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Download template
  const downloadTemplate = (template: ContributionTemplate) => {
    const blob = new Blob([template.template_content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Contribution Templates
          </h1>
          <p className="text-muted-foreground">
            Templates for developers to contribute to the platform
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Contribution Template</DialogTitle>
              <DialogDescription>
                Create a new template for developer contributions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Bug Report Template"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the template"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Template Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="# Bug Report&#10;&#10;## Description&#10;A clear description of the bug...&#10;&#10;## Steps to Reproduce&#10;1. Step one&#10;2. Step two&#10;&#10;## Expected Behavior&#10;What should happen..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button className="w-full" onClick={addTemplate}>
                Add Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label>Filter by category:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading templates...</p>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No templates available
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTemplates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded p-4 mb-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {template.template_content}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => copyToClipboard(template.template_content)}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => downloadTemplate(template)}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
