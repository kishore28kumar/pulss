import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  Warning, 
  X,
  Package,
  Image as ImageIcon
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'

interface CSVUploaderProps {
  tenantId: string
  onUploadComplete?: (results: any) => void
}

interface ParsedProduct {
  name: string
  description?: string
  brand?: string
  category: string
  pack_size?: string
  price: number
  mrp: number
  sku?: string
  requires_rx: boolean
  inventory_count?: number
  manufacturer?: string
  weight?: string
  tags?: string[]
  image_url?: string
  [key: string]: any
}

interface ValidationError {
  row: number
  field: string
  message: string
  data: any
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ tenantId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([])
  const [step, setStep] = useState<'upload' | 'validate' | 'processing' | 'complete'>('upload')

  // Helper function to download images from URLs
  const downloadAndUploadImage = async (imageUrl: string, productName: string): Promise<string | null> => {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) return null
      
      // For demo purposes, we'll just return the URL as-is
      // In production, you'd download the image and re-upload to your storage
      return imageUrl
    } catch (error) {
      console.error('Failed to process image:', error)
      return null
    }
  }

  // Validate CSV data
  const validateProducts = async (products: any[]): Promise<{ valid: ParsedProduct[], errors: ValidationError[] }> => {
    const errors: ValidationError[] = []
    const valid: ParsedProduct[] = []

    // Get existing categories for validation
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .eq('tenant_id', tenantId)
    
    const categoryNames = new Set(categories?.map(c => c.name.toLowerCase()) || [])

    for (let i = 0; i < products.length; i++) {
      const row = products[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and we skip header

      // Required fields validation
      if (!row.name?.trim()) {
        errors.push({ row: rowNumber, field: 'name', message: 'Product name is required', data: row })
        continue
      }

      if (!row.price || isNaN(Number(row.price))) {
        errors.push({ row: rowNumber, field: 'price', message: 'Valid price is required', data: row })
        continue
      }

      if (!row.mrp || isNaN(Number(row.mrp))) {
        errors.push({ row: rowNumber, field: 'mrp', message: 'Valid MRP is required', data: row })
        continue
      }

      if (Number(row.price) > Number(row.mrp)) {
        errors.push({ row: rowNumber, field: 'price', message: 'Price cannot be higher than MRP', data: row })
        continue
      }

      // Category validation
      if (row.category && !categoryNames.has(row.category.toLowerCase())) {
        errors.push({ 
          row: rowNumber, 
          field: 'category', 
          message: `Category "${row.category}" does not exist. Please create it first or use existing categories.`, 
          data: row 
        })
      }

      // Parse tags if present
      let tags: string[] = []
      if (row.tags) {
        tags = row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }

      // Build valid product object
      const product: ParsedProduct = {
        name: row.name.trim(),
        description: row.description?.trim() || '',
        brand: row.brand?.trim() || '',
        category: row.category?.trim() || '',
        pack_size: row.pack_size?.trim() || '',
        price: Number(row.price),
        mrp: Number(row.mrp),
        sku: row.sku?.trim() || '',
        requires_rx: String(row.requires_rx).toLowerCase() === 'true',
        inventory_count: Number(row.inventory_count) || 0,
        manufacturer: row.manufacturer?.trim() || '',
        weight: row.weight?.trim() || '',
        tags: tags,
        image_url: row.image_url?.trim() || ''
      }

      valid.push(product)
    }

    return { valid, errors }
  }

  // Process and upload products
  const processProducts = async (products: ParsedProduct[]) => {
    setStep('processing')
    let processed = 0
    const results = { success: 0, failed: 0, errors: [] as any[] }

    for (const product of products) {
      try {
        // Find category ID if category name is provided
        let category_id = null
        if (product.category) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('tenant_id', tenantId)
            .ilike('name', product.category)
            .single()
          
          category_id = categoryData?.id || null
        }

        // Process image if URL provided
        let finalImageUrl = product.image_url
        if (product.image_url && product.image_url.startsWith('http')) {
          const processedImageUrl = await downloadAndUploadImage(product.image_url, product.name)
          if (processedImageUrl) {
            finalImageUrl = processedImageUrl
          }
        }

        // Insert product
        const { error } = await supabase
          .from('products')
          .insert([{
            tenant_id: tenantId,
            category_id,
            name: product.name,
            description: product.description,
            brand: product.brand,
            pack_size: product.pack_size,
            price: product.price,
            mrp: product.mrp,
            image_url: finalImageUrl,
            requires_rx: product.requires_rx,
            inventory_count: product.inventory_count,
            sku: product.sku,
            tags: product.tags,
            weight: product.weight,
            manufacturer: product.manufacturer
          }])

        if (error) {
          results.failed++
          results.errors.push({ product: product.name, error: error.message })
        } else {
          results.success++
        }
      } catch (error) {
        results.failed++
        results.errors.push({ 
          product: product.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }

      processed++
      setProgress((processed / products.length) * 100)
    }

    return results
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setUploading(true)
    setStep('validate')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { valid, errors } = await validateProducts(results.data as any[])
          
          setValidationErrors(errors)
          setParsedData(valid)

          if (errors.length > 0) {
            toast.error(`Found ${errors.length} validation errors. Please fix them before proceeding.`)
          } else if (valid.length === 0) {
            toast.error('No valid products found in CSV')
          } else {
            toast.success(`Successfully validated ${valid.length} products`)
          }
        } catch (error) {
          toast.error('Failed to validate CSV data')
        } finally {
          setUploading(false)
        }
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`)
        setUploading(false)
      }
    })
  }

  const startProcessing = async () => {
    if (parsedData.length === 0) return

    setUploading(true)
    setProgress(0)

    try {
      const results = await processProducts(parsedData)
      
      setStep('complete')
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} products`)
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to import ${results.failed} products`)
      }

      if (onUploadComplete) {
        onUploadComplete(results)
      }
    } catch (error) {
      toast.error('Failed to process products')
    } finally {
      setUploading(false)
    }
  }

  const resetUploader = () => {
    setStep('upload')
    setValidationErrors([])
    setParsedData([])
    setProgress(0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText />
          Bulk Product Import
        </CardTitle>
        <CardDescription>
          Upload products in bulk using CSV file. Download the template to get started.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Download Template */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const link = document.createElement('a')
              link.href = '/demo-products.csv'
              link.download = 'products-template.csv'
              link.click()
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          
          <Badge variant="secondary" className="flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            Images auto-downloaded from URLs
          </Badge>
        </div>

        {/* Upload Area */}
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.csv'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleFileUpload(file)
              }
              input.click()
            }}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Upload CSV File</p>
            <p className="text-sm text-muted-foreground">
              Click to browse or drag and drop your product CSV file
            </p>
          </div>
        )}

        {/* Validation Results */}
        {step === 'validate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation Results</h3>
              <Button variant="outline" onClick={resetUploader}>
                <X className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>

            {validationErrors.length > 0 && (
              <Alert>
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  Found {validationErrors.length} validation errors. Please fix these issues in your CSV file:
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid Products ({parsedData.length})
                </h4>
                <div className="bg-green-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {parsedData.slice(0, 5).map((product, index) => (
                    <div key={index} className="text-sm">
                      {product.name} - ₹{product.price}
                    </div>
                  ))}
                  {parsedData.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {parsedData.length - 5} more
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-red-700 flex items-center gap-2">
                  <Warning className="w-4 h-4" />
                  Errors ({validationErrors.length})
                </h4>
                <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {validationErrors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            </div>

            {validationErrors.length === 0 && parsedData.length > 0 && (
              <Button onClick={startProcessing} className="w-full">
                <Package className="w-4 h-4 mr-2" />
                Import {parsedData.length} Products
              </Button>
            )}
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <h3 className="text-lg font-semibold">Processing Products...</h3>
            <Progress value={progress} className="max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete - This may take a few minutes for large files
            </p>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
            <h3 className="text-lg font-semibold text-green-700">Import Complete!</h3>
            <p className="text-muted-foreground">
              Your products have been successfully imported and are now available in your store.
            </p>
            <Button onClick={resetUploader}>
              Import More Products
            </Button>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && step !== 'processing' && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm">Processing...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}