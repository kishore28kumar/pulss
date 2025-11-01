import Papa from 'papaparse'

export interface CSVProduct {
  name: string
  category: string
  brand?: string
  pack_size?: string
  mrp: number
  selling_price: number
  image_url?: string
  requires_prescription?: boolean
  description?: string
}

export interface ParseResult {
  data: CSVProduct[]
  errors: string[]
  skipped: number
}

export const parseProductCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: CSVProduct[] = []
        const errors: string[] = []
        let skipped = 0

        results.data.forEach((row: any, index: number) => {
          const lineNumber = index + 2 // +2 because index starts at 0 and we have header

          try {
            // Required fields validation
            if (!row.name || !row.category) {
              errors.push(`Line ${lineNumber}: Missing required fields (name, category)`)
              skipped++
              return
            }

            // Price validation
            const mrp = parseFloat(row.mrp || '0')
            const selling_price = parseFloat(row.selling_price || '0')

            if (isNaN(mrp) || mrp <= 0) {
              errors.push(`Line ${lineNumber}: Invalid MRP value`)
              skipped++
              return
            }

            if (isNaN(selling_price) || selling_price <= 0) {
              errors.push(`Line ${lineNumber}: Invalid selling price value`)
              skipped++
              return
            }

            if (selling_price > mrp) {
              errors.push(`Line ${lineNumber}: Selling price cannot be greater than MRP`)
              skipped++
              return
            }

            // Build product object
            const product: CSVProduct = {
              name: row.name.trim(),
              category: row.category.trim(),
              mrp,
              selling_price,
              brand: row.brand?.trim() || '',
              pack_size: row.pack_size?.trim() || '',
              image_url: row.image_url?.trim() || '',
              description: row.description?.trim() || '',
              requires_prescription: row.requires_prescription?.toLowerCase() === 'true' || row.requires_prescription?.toLowerCase() === 'yes'
            }

            data.push(product)
          } catch (error) {
            errors.push(`Line ${lineNumber}: Parse error - ${error}`)
            skipped++
          }
        })

        resolve({ data, errors, skipped })
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [`CSV parsing failed: ${error.message}`],
          skipped: 0
        })
      }
    })
  })
}

export const generateSampleCSV = (): string => {
  const sampleData = [
    {
      name: 'Paracetamol 500mg',
      category: 'Pain Relief',
      brand: 'Generic',
      pack_size: '10 Tablets',
      mrp: '25.00',
      selling_price: '22.50',
      image_url: '',
      requires_prescription: 'false',
      description: 'Effective pain relief medication'
    },
    {
      name: 'Amoxicillin 500mg',
      category: 'Antibiotics',
      brand: 'Cipla',
      pack_size: '10 Capsules',
      mrp: '120.00',
      selling_price: '108.00',
      image_url: '',
      requires_prescription: 'true',
      description: 'Antibiotic for bacterial infections'
    },
    {
      name: 'Vitamin D3 1000IU',
      category: 'Vitamins',
      brand: 'HealthKart',
      pack_size: '60 Capsules',
      mrp: '450.00',
      selling_price: '399.00',
      image_url: '',
      requires_prescription: 'false',
      description: 'Essential vitamin supplement'
    }
  ]

  return Papa.unparse(sampleData)
}

export const downloadSampleCSV = () => {
  const csv = generateSampleCSV()
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample_products.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}