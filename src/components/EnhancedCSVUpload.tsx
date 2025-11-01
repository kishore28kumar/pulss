import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Package
} from '@phosphor-icons/react'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface CSVPreviewRow {
  row: number
  data: any
  imageValidation?: { valid: boolean; error?: string }
  imagesValidation?: Array<{ url: string; valid: boolean; error?: string }>
  errors: string[]
  warnings: string[]
}

interface ImportResults {
  total: number
  success: number
  failed: number
  errors: any[]
  warnings: any[]
  preview: CSVPreviewRow[]
}

export const EnhancedCSVUpload = ({ tenantId, onImportComplete }: { tenantId: string; onImportComplete?: () => void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [validationResults, setValidationResults] = useState<ImportResults | null>(null)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [validateImages, setValidateImages] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setValidationResults(null)
      setImportResults(null)
    }
  }

  const handleValidate = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setValidating(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const response = await fetch(
        `/api/products/tenants/${tenantId}/import-csv?validate_only=true&validate_images=${validateImages}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      )

      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Validation failed')
      }

      const data = await response.json()
      setValidationResults(data.results)
      
      if (data.results.failed === 0) {
        toast.success('Validation passed! Ready to import.')
      } else {
        toast.warning(`Validation complete with ${data.results.failed} errors`)
      }
    } catch (error: any) {
      console.error('Validation error:', error)
      toast.error(error.message || 'Failed to validate CSV')
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setImporting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const response = await fetch(
        `/api/products/tenants/${tenantId}/import-csv?validate_images=${validateImages}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      )

      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const data = await response.json()
      setImportResults(data.results)
      
      toast.success(`Import complete! ${data.results.success} products imported successfully.`)
      
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(error.message || 'Failed to import CSV')
    } finally {
      setImporting(false)
    }
  }

  const downloadSample = () => {
    const sample = `name,brand,category,price,mrp,image_url,images,requires_rx,description,pack_size,manufacturer,sku,tags
Paracetamol 500mg,Cipla,Medicines,50,60,https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300,"https://example.com/img1.jpg,https://example.com/img2.jpg",false,Effective pain relief,Strip of 10,Cipla Ltd,PAR-500,medicine;painkiller
Vitamin D3,HealthKart,Supplements,200,250,https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300,,false,Weekly vitamin supplement,4 capsules,HealthKart,VIT-D3,vitamin;health`

    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>CSV Product Import</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import products. Images will be validated if URLs are provided.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={downloadSample}>
                <Download className="h-4 w-4 mr-2" />
                Sample
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="validate-images"
              checked={validateImages}
              onChange={(e) => setValidateImages(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="validate-images" className="text-sm font-normal cursor-pointer">
              Validate image URLs (may take longer)
            </Label>
          </div>

          {/* Progress */}
          {(validating || importing) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{validating ? 'Validating...' : 'Importing...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleValidate}
              disabled={!file || validating || importing}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Validate
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || validating || importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Preview of first 10 rows with validation status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{validationResults.total}</div>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResults.total - validationResults.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {validationResults.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <h4 className="font-semibold">Preview (First 10 rows)</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {validationResults.preview.map((row) => (
                  <Card 
                    key={row.row}
                    className={
                      row.errors.length > 0 
                        ? 'border-red-200' 
                        : row.warnings.length > 0 
                        ? 'border-yellow-200' 
                        : 'border-green-200'
                    }
                  >
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{row.data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Row {row.row} • {row.data.brand} • ₹{row.data.price}
                          </p>
                        </div>
                        {row.errors.length === 0 && row.warnings.length === 0 && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {row.errors.length > 0 && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {row.warnings.length > 0 && row.errors.length === 0 && (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>

                      {/* Image Validation */}
                      {row.data.image_url && row.imageValidation && (
                        <div className="flex items-center space-x-2 text-sm">
                          {row.imageValidation.valid ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Image URL valid</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Image: {row.imageValidation.error}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Errors */}
                      {row.errors.length > 0 && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-sm">
                            {row.errors.map((error, i) => (
                              <div key={i}>• {error}</div>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Warnings */}
                      {row.warnings.length > 0 && (
                        <Alert className="py-2 border-yellow-200 bg-yellow-50">
                          <AlertDescription className="text-sm text-yellow-800">
                            {row.warnings.map((warning, i) => (
                              <div key={i}>• {warning}</div>
                            ))}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{importResults.total}</div>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            {/* Errors */}
            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Errors</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {importResults.errors.map((error, i) => (
                    <Alert key={i} variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        Row {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
