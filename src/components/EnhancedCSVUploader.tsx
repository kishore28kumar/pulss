import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Upload, Download, FileText, Check, X, Warning } from '@phosphor-icons/react'
import Papa from 'papaparse'

interface CSVProduct {
  name: string
  description?: string
  brand?: string
  composition?: string
  price: number
  mrp: number
  category: string
  subcategory?: string
  image_url?: string
  requires_rx: boolean
  tags?: string
  pack_size?: string
  manufacturer?: string
  country_of_origin?: string
  storage_instructions?: string
  usage_instructions?: string
  side_effects?: string
  contraindications?: string
  drug_interactions?: string
}

interface ProcessedProduct extends CSVProduct {
  category_id?: string
  row_number: number
  status: 'pending' | 'success' | 'error'
  error_message?: string
}

interface CSVUploaderProps {
  tenantId: string
  onUploadComplete: (results: any) => void
}

export const EnhancedCSVUploader = ({ tenantId, onUploadComplete }: CSVUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResults, setUploadResults] = useState<{
    total: number
    success: number
    errors: number
    products: ProcessedProduct[]
  } | null>(null)
  const [progress, setProgress] = useState(0)
  
  const queryClient = useQueryClient()
  
  // Sample CSV data for template
  const sampleCSVData = [
    {
      name: "Paracetamol 500mg Tablet",
      description: "Pain reliever and fever reducer",
      brand: "Crocin",
      composition: "Paracetamol 500mg",
      price: 25.50,
      mrp: 30.00,
      category: "Pain Relief",
      subcategory: "Analgesics",
      image_url: "https://example.com/paracetamol.jpg",
      requires_rx: false,
      tags: "fever,headache,pain,paracetamol,crocin",
      pack_size: "10 Tablets",
      manufacturer: "GSK",
      country_of_origin: "India",
      storage_instructions: "Store in cool, dry place below 30°C",
      usage_instructions: "Adults: 1-2 tablets every 4-6 hours. Max 8 tablets in 24 hours",
      side_effects: "Rare: skin rash, nausea",
      contraindications: "Severe liver disease, allergy to paracetamol",
      drug_interactions: "Alcohol, blood thinners"
    },
    {
      name: "Amoxicillin 500mg Capsule", 
      description: "Antibiotic for bacterial infections",
      brand: "Amoxil",
      composition: "Amoxicillin 500mg",
      price: 45.75,
      mrp: 55.00,
      category: "Antibiotics",
      subcategory: "Penicillins", 
      image_url: "https://example.com/amoxicillin.jpg",
      requires_rx: true,
      tags: "antibiotic,infection,amoxicillin,bacterial",
      pack_size: "10 Capsules",
      manufacturer: "Cipla",
      country_of_origin: "India",
      storage_instructions: "Store below 25°C, protect from moisture",
      usage_instructions: "As prescribed by physician. Take with or without food",
      side_effects: "Nausea, diarrhea, skin rash, allergic reactions",
      contraindications: "Allergy to penicillin, severe kidney disease",
      drug_interactions: "Birth control pills, blood thinners"
    },
    {
      name: "Vitamin D3 1000 IU Tablet",
      description: "Vitamin D supplement for bone health", 
      brand: "D3 Must",
      composition: "Cholecalciferol 1000 IU",
      price: 120.00,
      mrp: 150.00,
      category: "Vitamins & Supplements",
      subcategory: "Vitamin D",
      image_url: "https://example.com/vitamin-d3.jpg",
      requires_rx: false,
      tags: "vitamin,supplement,bone health,immunity,vitamin d3",
      pack_size: "30 Tablets",
      manufacturer: "Mankind Pharma",
      country_of_origin: "India",
      storage_instructions: "Store in cool, dry place, protect from light",
      usage_instructions: "1 tablet daily with meal or as directed by physician",
      side_effects: "Rare: nausea, vomiting, weakness",
      contraindications: "Hypercalcemia, kidney stones",
      drug_interactions: "Thiazide diuretics, heart medications"
    }
  ]
  
  const downloadTemplate = () => {
    const csv = Papa.unparse(sampleCSVData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'pulss-products-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV template downloaded!')
  }
  
  const processCSVMutation = useMutation({
    mutationFn: async (products: ProcessedProduct[]) => {
      const results = {
        total: products.length,
        success: 0,
        errors: 0,
        products: [...products]
      }
      
      // Process in batches of 10
      const batchSize = 10
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        const batchPromises = batch.map(async (product, batchIndex) => {
          const globalIndex = i + batchIndex
          try {
            // Find or create category
            let categoryId = product.category_id
            if (!categoryId && product.category) {
              const { data: existingCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('name', product.category)
                .single()
              
              if (existingCategory) {
                categoryId = existingCategory.id
              } else {
                // Create new category
                const { data: newCategory, error: categoryError } = await supabase
                  .from('categories')
                  .insert({
                    tenant_id: tenantId,
                    name: product.category,
                    description: `Auto-created for ${product.category}`,
                    is_active: true,
                    display_order: 0,
                    created_at: new Date().toISOString()
                  })
                  .select('id')
                  .single()
                
                if (categoryError) throw categoryError
                categoryId = newCategory.id
              }
            }
            
            // Insert product
            const { error: productError } = await supabase
              .from('products')
              .insert({
                tenant_id: tenantId,
                name: product.name,
                description: product.description,
                brand: product.brand,
                composition: product.composition,
                price: product.price,
                mrp: product.mrp,
                category_id: categoryId,
                image_url: product.image_url,
                requires_rx: product.requires_rx,
                tags: product.tags ? product.tags.split(',').map(t => t.trim()) : [],
                pack_size: product.pack_size,
                manufacturer: product.manufacturer,
                country_of_origin: product.country_of_origin,
                storage_instructions: product.storage_instructions,
                usage_instructions: product.usage_instructions,
                side_effects: product.side_effects,
                contraindications: product.contraindications,
                drug_interactions: product.drug_interactions,
                is_active: true,
                inventory_count: 100, // Default inventory
                created_at: new Date().toISOString()
              })
            
            if (productError) throw productError
            
            results.products[globalIndex].status = 'success'
            results.success++
            
          } catch (error) {
            results.products[globalIndex].status = 'error'
            results.products[globalIndex].error_message = error instanceof Error ? error.message : 'Unknown error'
            results.errors++
          }
          
          // Update progress
          const progressPercent = Math.round(((globalIndex + 1) / products.length) * 100)
          setProgress(progressPercent)
        })
        
        await Promise.all(batchPromises)
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      return results
    },
    onSuccess: (results) => {
      setUploadResults(results)
      setIsProcessing(false)
      
      toast.success(`Upload completed! ${results.success} products added successfully.`)
      if (results.errors > 0) {
        toast.warning(`${results.errors} products had errors. Check the results below.`)
      }
      
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onUploadComplete(results)
    },
    onError: (error) => {
      setIsProcessing(false)
      setProgress(0)
      toast.error('Upload failed: ' + error.message)
    }
  })
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }
    
    setIsProcessing(true)
    setProgress(0)
    setUploadResults(null)
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('CSV parsing error: ' + results.errors[0].message)
          setIsProcessing(false)
          return
        }
        
        // Validate and process data
        const processedProducts: ProcessedProduct[] = results.data.map((row: any, index) => {
          const product: ProcessedProduct = {
            row_number: index + 1,
            status: 'pending',
            name: row.name?.trim() || '',
            description: row.description?.trim(),
            brand: row.brand?.trim(),
            composition: row.composition?.trim(),
            price: parseFloat(row.price) || 0,
            mrp: parseFloat(row.mrp) || 0,
            category: row.category?.trim() || '',
            subcategory: row.subcategory?.trim(),
            image_url: row.image_url?.trim(),
            requires_rx: row.requires_rx === 'true' || row.requires_rx === '1' || row.requires_rx === 'yes',
            tags: row.tags?.trim(),
            pack_size: row.pack_size?.trim(),
            manufacturer: row.manufacturer?.trim(),
            country_of_origin: row.country_of_origin?.trim(),
            storage_instructions: row.storage_instructions?.trim(),
            usage_instructions: row.usage_instructions?.trim(),
            side_effects: row.side_effects?.trim(),
            contraindications: row.contraindications?.trim(),
            drug_interactions: row.drug_interactions?.trim()
          }
          
          // Validation
          if (!product.name) {
            product.status = 'error'
            product.error_message = 'Product name is required'
          } else if (!product.category) {
            product.status = 'error'
            product.error_message = 'Category is required'
          } else if (product.price <= 0) {
            product.status = 'error'
            product.error_message = 'Valid price is required'
          } else if (product.mrp < product.price) {
            product.status = 'error'
            product.error_message = 'MRP cannot be less than price'
          }
          
          return product
        }).filter(p => p.name) // Remove empty rows
        
        if (processedProducts.length === 0) {
          toast.error('No valid products found in CSV')
          setIsProcessing(false)
          return
        }
        
        const validProducts = processedProducts.filter(p => p.status === 'pending')
        if (validProducts.length === 0) {
          toast.error('All products have validation errors')
          setIsProcessing(false)
          return
        }
        
        toast.info(`Processing ${processedProducts.length} products...`)
        processCSVMutation.mutate(processedProducts)
      },
      error: (error) => {
        toast.error('Failed to parse CSV: ' + error.message)
        setIsProcessing(false)
      }
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Product Upload
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload hundreds or thousands of products at once using CSV file
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Warning className="w-4 h-4" />
            <AlertDescription>
              Download the template first, fill in your product data, then upload the completed CSV file.
              The system will automatically create categories and validate all data.
            </AlertDescription>
          </Alert>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="h-20 flex-col gap-2"
            >
              <Download className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Download Template</div>
                <div className="text-xs text-muted-foreground">
                  CSV with sample products
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => document.getElementById('csv-upload')?.click()}
              disabled={isProcessing}
              className="h-20 flex-col gap-2"
            >
              <Upload className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">
                  {isProcessing ? 'Processing...' : 'Upload CSV'}
                </div>
                <div className="text-xs opacity-80">
                  Select your completed CSV file
                </div>
              </div>
            </Button>
          </div>
          
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* CSV Template Fields Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CSV Template Fields Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Required Fields</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>name</code> - Product name</li>
                <li>• <code>price</code> - Selling price (₹)</li>
                <li>• <code>mrp</code> - Maximum retail price (₹)</li>
                <li>• <code>category</code> - Product category</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Product Details</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>description</code> - Product description</li>
                <li>• <code>brand</code> - Brand/company name</li>
                <li>• <code>composition</code> - Active ingredients</li>
                <li>• <code>pack_size</code> - Package size info</li>
                <li>• <code>manufacturer</code> - Manufacturing company</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Medical Information</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>requires_rx</code> - true/false for prescription</li>
                <li>• <code>usage_instructions</code> - How to use</li>
                <li>• <code>side_effects</code> - Possible side effects</li>
                <li>• <code>contraindications</code> - When not to use</li>
                <li>• <code>drug_interactions</code> - Drug interactions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Search & Discovery</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>tags</code> - Search keywords (comma-separated)</li>
                <li>• <code>subcategory</code> - Subcategory name</li>
                <li>• <code>image_url</code> - Product image URL</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Storage & Origin</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>storage_instructions</code> - Storage conditions</li>
                <li>• <code>country_of_origin</code> - Manufacturing country</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Results */}
      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Upload Results
              </span>
              <div className="flex gap-2">
                <Badge variant="default">
                  {uploadResults.success} Success
                </Badge>
                {uploadResults.errors > 0 && (
                  <Badge variant="destructive">
                    {uploadResults.errors} Errors
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadResults.products.map((product) => (
                <div
                  key={product.row_number}
                  className={`flex items-center gap-3 p-2 rounded text-sm ${
                    product.status === 'success'
                      ? 'bg-green-50 text-green-800'
                      : product.status === 'error'
                      ? 'bg-red-50 text-red-800'
                      : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  {product.status === 'success' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : product.status === 'error' ? (
                    <X className="w-4 h-4 text-red-600" />
                  ) : (
                    <Warning className="w-4 h-4 text-yellow-600" />
                  )}
                  
                  <div className="flex-1">
                    <span className="font-medium">
                      Row {product.row_number}: {product.name}
                    </span>
                    {product.error_message && (
                      <div className="text-xs opacity-75">
                        {product.error_message}
                      </div>
                    )}
                  </div>
                  
                  {product.status === 'success' && (
                    <Badge variant="outline" className="text-xs">
                      ₹{product.price}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}