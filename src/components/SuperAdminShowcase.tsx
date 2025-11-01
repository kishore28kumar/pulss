import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  StorefrontIcon, 
  TrendUp, 
  Users, 
  ShoppingCart, 
  Star,
  Crown,
  Trophy
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TopTenant {
  id: string
  name: string
  subdomain: string
  logo_url: string
  business_name: string
  total_orders: number
  total_revenue: number
  total_customers: number
  created_at: string
}

interface UserStory {
  id: string
  tenant_id: string
  customer_name: string
  story: string
  rating: number
  is_featured: boolean
  created_at: string
}

interface ShowcaseProps {
  apiUrl: string
  authToken: string
}

export const SuperAdminShowcase: React.FC<ShowcaseProps> = ({
  apiUrl,
  authToken
}) => {
  const [topTenants, setTopTenants] = useState<TopTenant[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)

  // Load showcase data
  const loadShowcase = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/super-admin/showcase`, {
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
        throw new Error('Failed to load showcase')
      }

      const data = await response.json()
      setTopTenants(data.data.top_tenants || [])
      setUserStories(data.data.user_stories || [])
    } catch (error) {
      console.error('Error loading showcase:', error)
      toast.error('Failed to load showcase data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShowcase()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading showcase...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-8 h-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold">Platform Showcase</h1>
          <p className="text-muted-foreground">
            Highlighting our top-performing stores and success stories
          </p>
        </div>
      </div>

      <Tabs defaultValue="tenants" className="w-full">
        <TabsList>
          <TabsTrigger value="tenants" className="gap-2">
            <Trophy className="w-4 h-4" />
            Top Stores
          </TabsTrigger>
          <TabsTrigger value="stories" className="gap-2">
            <Star className="w-4 h-4" />
            Success Stories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Performing Stores</CardTitle>
              <CardDescription>
                Based on total revenue and customer engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTenants.map((tenant, index) => (
                  <Card key={tenant.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          <Badge 
                            className={`text-lg font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' :
                              'bg-gray-300'
                            }`}
                          >
                            #{index + 1}
                          </Badge>
                        </div>

                        {/* Store Logo */}
                        <div className="flex-shrink-0">
                          {tenant.logo_url ? (
                            <img
                              src={tenant.logo_url}
                              alt={tenant.business_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                              <StorefrontIcon className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Store Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{tenant.business_name || tenant.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tenant.subdomain ? `${tenant.subdomain}.pulss.app` : 'No subdomain'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Member since {formatDate(tenant.created_at)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <TrendUp className="w-4 h-4" />
                              <span className="font-bold">{formatCurrency(tenant.total_revenue)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-blue-600">
                              <ShoppingCart className="w-4 h-4" />
                              <span className="font-bold">{tenant.total_orders}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Orders</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center gap-1 text-purple-600">
                              <Users className="w-4 h-4" />
                              <span className="font-bold">{tenant.total_customers}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Customers</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {topTenants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No stores data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Success Stories</CardTitle>
              <CardDescription>
                Real testimonials from satisfied customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {userStories.map((story) => (
                  <Card key={story.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{story.customer_name}</h4>
                          <div className="flex gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < story.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {story.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{story.story}"</p>
                      <p className="text-xs text-muted-foreground mt-4">
                        {formatDate(story.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {userStories.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No success stories available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
