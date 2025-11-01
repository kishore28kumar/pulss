import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AreaHeatmapProps {
  data: Array<{
    area: string
    state: string
    total_revenue: number
    total_orders: number
  }>
}

export const AreaHeatmap: React.FC<AreaHeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Heatmap by Area</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No data available</p>
        </CardContent>
      </Card>
    )
  }

  // Find min and max revenue for color scaling
  const revenues = data.map(d => parseFloat(d.total_revenue.toString()))
  const maxRevenue = Math.max(...revenues)
  const minRevenue = Math.min(...revenues)

  // Calculate color intensity based on revenue
  const getColor = (revenue: number) => {
    const normalized = (revenue - minRevenue) / (maxRevenue - minRevenue)
    
    if (normalized > 0.75) return 'bg-green-600'
    if (normalized > 0.5) return 'bg-green-500'
    if (normalized > 0.25) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getTextColor = (revenue: number) => {
    const normalized = (revenue - minRevenue) / (maxRevenue - minRevenue)
    return normalized > 0.5 ? 'text-white' : 'text-gray-900'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  // Group by state
  const groupedByState = data.reduce((acc, item) => {
    if (!acc[item.state]) {
      acc[item.state] = []
    }
    acc[item.state].push(item)
    return acc
  }, {} as Record<string, typeof data>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Heatmap by Area</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedByState).slice(0, 5).map(([state, areas]) => (
            <div key={state}>
              <h3 className="text-sm font-semibold mb-3">{state}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {areas.slice(0, 10).map((area, index) => {
                  const revenue = parseFloat(area.total_revenue.toString())
                  return (
                    <div
                      key={index}
                      className={`${getColor(revenue)} ${getTextColor(revenue)} p-3 rounded-lg transition-all hover:scale-105 cursor-pointer`}
                      title={`${area.area}: ${formatCurrency(revenue)} from ${area.total_orders} orders`}
                    >
                      <div className="font-medium text-sm truncate">{area.area}</div>
                      <div className="text-xs mt-1">{formatCurrency(revenue)}</div>
                      <div className="text-xs opacity-80">{area.total_orders} orders</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <span className="text-sm text-muted-foreground">Revenue:</span>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-orange-500 rounded"></div>
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-green-500 rounded"></div>
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-green-600 rounded"></div>
              <span className="text-xs">Very High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
