import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Book, 
  Code, 
  Rocket, 
  List, 
  Search,
  Copy,
  ExternalLink,
  CheckCircle,
  Info
} from '@phosphor-icons/react'
import { marked } from 'marked'

interface Documentation {
  id: string
  slug: string
  title: string
  description: string
  category: string
  content: string
  code_samples: Record<string, string> | null
  updated_at: string
}

interface ChangelogEntry {
  id: string
  version: string
  release_date: string
  type: string
  title: string
  description: string
  changes: {
    added?: string[]
    changed?: string[]
    deprecated?: string[]
    removed?: string[]
    fixed?: string[]
  }
  is_breaking: boolean
}

export const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState('documentation')
  const [documentation, setDocumentation] = useState<Documentation[]>([])
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocumentation()
    fetchChangelog()
  }, [])

  const fetchDocumentation = async () => {
    try {
      const response = await fetch('/api/api-management/docs')
      if (response.ok) {
        const data = await response.json()
        setDocumentation(data.data)
        if (data.data.length > 0) {
          setSelectedDoc(data.data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching documentation:', error)
      toast.error('Failed to fetch documentation')
    } finally {
      setLoading(false)
    }
  }

  const fetchChangelog = async () => {
    try {
      const response = await fetch('/api/api-management/changelog')
      if (response.ok) {
        const data = await response.json()
        setChangelog(data.data)
      }
    } catch (error) {
      console.error('Error fetching changelog:', error)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const groupedDocs = documentation.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, Documentation[]>)

  const filteredDocs = documentation.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started':
        return <Rocket className="h-4 w-4" />
      case 'api-reference':
        return <Code className="h-4 w-4" />
      case 'guides':
        return <Book className="h-4 w-4" />
      case 'changelog':
        return <List className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-500'
      case 'minor':
        return 'bg-blue-500'
      case 'patch':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Book className="h-8 w-8" />
                Developer Portal
              </h1>
              <p className="text-muted-foreground mt-1">
                API documentation, guides, and resources for developers
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="https://github.com/yourusername/pulss-api" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button asChild>
                <a href="/dashboard/api-keys">
                  Get API Key
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documentation">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="api-reference">
              <Code className="h-4 w-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="changelog">
              <List className="h-4 w-4 mr-2" />
              Changelog
            </TabsTrigger>
            <TabsTrigger value="quick-start">
              <Rocket className="h-4 w-4 mr-2" />
              Quick Start
            </TabsTrigger>
          </TabsList>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar */}
              <div className="col-span-3 space-y-4">
                {Object.entries(groupedDocs).map(([category, docs]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getCategoryIcon(category)}
                        {getCategoryLabel(category)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {docs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                            selectedDoc?.id === doc.id ? 'bg-muted font-medium' : ''
                          }`}
                        >
                          {doc.title}
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Content */}
              <div className="col-span-9">
                {selectedDoc ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl">{selectedDoc.title}</CardTitle>
                          <CardDescription>{selectedDoc.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{getCategoryLabel(selectedDoc.category)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Markdown Content */}
                      <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(selectedDoc.content) }}
                      />

                      {/* Code Samples */}
                      {selectedDoc.code_samples && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Code Examples</h3>
                          <Tabs defaultValue={Object.keys(selectedDoc.code_samples)[0]}>
                            <TabsList>
                              {Object.keys(selectedDoc.code_samples).map((lang) => (
                                <TabsTrigger key={lang} value={lang}>
                                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            {Object.entries(selectedDoc.code_samples).map(([lang, code]) => (
                              <TabsContent key={lang} value={lang}>
                                <div className="relative">
                                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                    <code>{code}</code>
                                  </pre>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyCode(code)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Last updated: {new Date(selectedDoc.updated_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Book className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Select a documentation page</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* API Reference Tab */}
          <TabsContent value="api-reference">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Complete reference for all API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Base URL */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                    <code className="block bg-muted p-3 rounded-lg">
                      https://api.pulss.com/v1
                    </code>
                  </div>

                  {/* Authentication */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      All API requests require authentication using an API key in the Authorization header:
                    </p>
                    <code className="block bg-muted p-3 rounded-lg">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>

                  {/* Endpoints */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Endpoints</h3>
                    <div className="space-y-4">
                      {/* Products */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Products</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">GET</Badge>
                            <code className="text-sm">/api/products</code>
                            <span className="text-sm text-muted-foreground">List all products</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500">POST</Badge>
                            <code className="text-sm">/api/products</code>
                            <span className="text-sm text-muted-foreground">Create a product</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Orders */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">GET</Badge>
                            <code className="text-sm">/api/orders</code>
                            <span className="text-sm text-muted-foreground">List all orders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">GET</Badge>
                            <code className="text-sm">/api/orders/:id</code>
                            <span className="text-sm text-muted-foreground">Get order details</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Changelog Tab */}
          <TabsContent value="changelog">
            <div className="space-y-4">
              {changelog.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">v{entry.version}</CardTitle>
                        <Badge className={getChangeTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                        {entry.is_breaking && (
                          <Badge variant="destructive">Breaking Change</Badge>
                        )}
                      </div>
                      <Badge variant="outline">
                        {new Date(entry.release_date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <CardDescription className="text-base mt-2">
                      {entry.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{entry.description}</p>

                    {/* Changes */}
                    {entry.changes.added && entry.changes.added.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Added
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {entry.changes.added.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.changes.changed && entry.changes.changed.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Changed</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {entry.changes.changed.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.changes.fixed && entry.changes.fixed.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Fixed</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {entry.changes.fixed.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>
                  Get started with the Pulss API in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Get your API Key</h3>
                  <p className="text-muted-foreground mb-2">
                    Generate an API key from your dashboard to authenticate your requests.
                  </p>
                  <Button asChild>
                    <a href="/dashboard/api-keys">Generate API Key</a>
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Make your first request</h3>
                  <p className="text-muted-foreground mb-3">
                    Use your API key to make a request to the Pulss API:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{`curl -X GET https://api.pulss.com/v1/products \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(`curl -X GET https://api.pulss.com/v1/products \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. Explore the API</h3>
                  <p className="text-muted-foreground mb-3">
                    Check out our comprehensive documentation to learn more about available endpoints and features.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('documentation')}>
                    <Book className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
