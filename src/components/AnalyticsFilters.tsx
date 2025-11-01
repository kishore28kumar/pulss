import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FunnelSimple, X } from '@phosphor-icons/react'

interface AnalyticsFiltersProps {
  onFilterChange: (filters: AnalyticsFilterState) => void
  tenants?: Array<{ tenant_id: string; tenant_name: string }>
  areas?: Array<{ area: string }>
  categories?: string[]
}

export interface AnalyticsFilterState {
  tenantId?: string
  area?: string
  category?: string
  minRevenue?: number
  maxRevenue?: number
  minOrders?: number
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  onFilterChange,
  tenants = [],
  areas = [],
  categories = []
}) => {
  const [filters, setFilters] = useState<AnalyticsFilterState>({})
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof AnalyticsFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FunnelSimple className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tenant Filter */}
            {tenants.length > 0 && (
              <div className="space-y-2">
                <Label>Store/Chemist</Label>
                <Select
                  value={filters.tenantId || ''}
                  onValueChange={(value) => updateFilter('tenantId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Stores</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.tenant_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Area Filter */}
            {areas.length > 0 && (
              <div className="space-y-2">
                <Label>Area/City</Label>
                <Select
                  value={filters.area || ''}
                  onValueChange={(value) => updateFilter('area', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Areas</SelectItem>
                    {areas.map((area, index) => (
                      <SelectItem key={index} value={area.area}>
                        {area.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Product Category</Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => updateFilter('category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Min Revenue Filter */}
            <div className="space-y-2">
              <Label>Min Revenue</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minRevenue || ''}
                onChange={(e) => updateFilter('minRevenue', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            {/* Max Revenue Filter */}
            <div className="space-y-2">
              <Label>Max Revenue</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={filters.maxRevenue || ''}
                onChange={(e) => updateFilter('maxRevenue', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            {/* Min Orders Filter */}
            <div className="space-y-2">
              <Label>Min Orders</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minOrders || ''}
                onChange={(e) => updateFilter('minOrders', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
