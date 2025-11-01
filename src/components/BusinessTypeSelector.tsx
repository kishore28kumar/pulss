import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BUSINESS_TYPES, BusinessType } from '@/lib/businessTypes'
import { Storefront, ShoppingBag } from '@phosphor-icons/react'

interface BusinessTypeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (businessType: BusinessType) => void
  selectedType?: string
}

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedType
}) => {
  const handleSelect = (businessType: BusinessType) => {
    onSelect(businessType)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Storefront className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>Select Your Business Type</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the type that best describes your business. This will customize the app interface and features for your needs.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {BUSINESS_TYPES.map((businessType) => (
            <Card 
              key={businessType.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedType === businessType.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleSelect(businessType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{businessType.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{businessType.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {businessType.welcomeMessage}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Search Placeholder:</p>
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded italic">
                    "{businessType.searchPlaceholder}"
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {businessType.categories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {businessType.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{businessType.categories.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Special Fields:</p>
                  <div className="text-xs text-muted-foreground">
                    {businessType.productFields.filter(f => f.required).slice(0, 2).map(field => field.label).join(', ')}
                    {businessType.productFields.filter(f => f.required).length > 2 && '...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BusinessTypeDisplayProps {
  businessType: BusinessType
  showEditButton?: boolean
  onEdit?: () => void
}

export const BusinessTypeDisplay: React.FC<BusinessTypeDisplayProps> = ({
  businessType,
  showEditButton = false,
  onEdit
}) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-card border rounded-lg">
      <div className="text-3xl">{businessType.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-lg">{businessType.name}</h3>
          {showEditButton && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Change
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {businessType.welcomeMessage}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Search Experience:</p>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              "{businessType.searchPlaceholder}"
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Product Categories:</p>
            <div className="flex flex-wrap gap-1">
              {businessType.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}