import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Label } from './ui/label'

interface Variant {
  variant_id: string
  variant_name: string
  variant_type: string
  price: number
  mrp: number
  inventory_count: number
  is_default: boolean
  active: boolean
}

interface VariantsByType {
  [key: string]: Variant[]
}

interface VariantSelectorProps {
  variants: Variant[]
  variantsByType: VariantsByType
  onVariantChange: (selectedVariants: { [key: string]: Variant }) => void
  className?: string
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  variantsByType,
  onVariantChange,
  className = ''
}) => {
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: Variant }>({})
  
  // Initialize with default variants
  useEffect(() => {
    const defaults: { [key: string]: Variant } = {}
    
    Object.keys(variantsByType).forEach(type => {
      const typeVariants = variantsByType[type]
      const defaultVariant = typeVariants.find(v => v.is_default) || typeVariants[0]
      if (defaultVariant) {
        defaults[type] = defaultVariant
      }
    })
    
    setSelectedVariants(defaults)
    onVariantChange(defaults)
  }, [variantsByType])
  
  const handleVariantSelect = (variantType: string, variantId: string) => {
    const variant = variantsByType[variantType]?.find(v => v.variant_id === variantId)
    if (variant) {
      const newSelection = {
        ...selectedVariants,
        [variantType]: variant
      }
      setSelectedVariants(newSelection)
      onVariantChange(newSelection)
    }
  }
  
  // Format variant type for display
  const formatVariantType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Check if variant is in stock
  const isInStock = (variant: Variant): boolean => {
    return variant.active && variant.inventory_count > 0
  }
  
  if (!variants || variants.length === 0) {
    return null
  }
  
  const variantTypes = Object.keys(variantsByType)
  
  if (variantTypes.length === 0) {
    return null
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {variantTypes.map(variantType => {
        const typeVariants = variantsByType[variantType]
        const selected = selectedVariants[variantType]
        
        return (
          <div key={variantType} className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">
              {formatVariantType(variantType)}
            </Label>
            
            <Select
              value={selected?.variant_id}
              onValueChange={(value) => handleVariantSelect(variantType, value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  {selected ? (
                    <div className="flex items-center justify-between w-full">
                      <span>{selected.variant_name}</span>
                      {!isInStock(selected) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  ) : (
                    'Select...'
                  )}
                </SelectValue>
              </SelectTrigger>
              
              <SelectContent>
                {typeVariants.map(variant => (
                  <SelectItem
                    key={variant.variant_id}
                    value={variant.variant_id}
                    disabled={!isInStock(variant)}
                    className="text-sm"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{variant.variant_name}</span>
                      <div className="flex items-center gap-2 ml-4">
                        {variant.price && (
                          <span className="text-xs font-medium text-green-600">
                            ₹{variant.price}
                          </span>
                        )}
                        {!isInStock(variant) && (
                          <Badge variant="outline" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                        {variant.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selected && selected.inventory_count > 0 && selected.inventory_count < 10 && (
              <p className="text-xs text-amber-600">
                Only {selected.inventory_count} left in stock
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
