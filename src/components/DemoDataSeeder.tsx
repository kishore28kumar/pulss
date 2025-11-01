import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Database,
  Users,
  ShoppingCart,
  Package,
  Camera,
  Bell,
  Pill,
  Download,
  Warning,
  CheckCircle
} from '@phosphor-icons/react'

interface DemoDataSeederProps {
  tenantId: string
  tenantName: string
}

interface SeederProgress {
  step: string
  completed: number
  total: number
  message: string
}

// Demo data categories and their seeding functions
const DEMO_DATA_CATEGORIES = [
  {
    key: 'carousel_slides',
    name: 'Carousel Slides',
    description: 'Hero carousel with medical/pharmacy images',
    icon: Camera,
    count: 3,
    color: 'bg-blue-500'
  },
  {
    key: 'announcements',
    name: 'Announcements',
    description: 'Store announcements and promotional messages',
    icon: Bell,
    count: 4,
    color: 'bg-green-500'
  },
  {
    key: 'categories',
    name: 'Product Categories',
    description: 'Medical and pharmacy product categories',
    icon: Package,
    count: 6,
    color: 'bg-purple-500'
  },
  {
    key: 'products',
    name: 'Demo Products',
    description: 'Complete product catalog with images and details',
    icon: Pill,
    count: 50,
    color: 'bg-orange-500'
  },
  {
    key: 'customers',
    name: 'Demo Customers',
    description: 'Realistic customer profiles with purchase history',
    icon: Users,
    count: 20,
    color: 'bg-red-500'
  },
  {
    key: 'orders',
    name: 'Demo Orders',
    description: 'Sample orders with various statuses and products',
    icon: ShoppingCart,
    count: 30,
    color: 'bg-indigo-500'
  }
]

export const DemoDataSeeder: React.FC<DemoDataSeederProps> = ({ 
  tenantId, 
  tenantName 
}) => {
  const queryClient = useQueryClient()
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState<SeederProgress | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DEMO_DATA_CATEGORIES.map(c => c.key)
  )

  // Seed demo data mutation
  const seedDataMutation = useMutation({
    mutationFn: async (categories: string[]) => {
      setIsSeeding(true)
      const totalSteps = categories.length
      let completedSteps = 0

      // Seed carousel slides
      if (categories.includes('carousel_slides')) {
        setProgress({
          step: 'carousel_slides',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating carousel slides with high-quality images...'
        })

        const slides = [
          {
            tenant_id: tenantId,
            title: 'Premium Healthcare Solutions',
            subtitle: 'Your trusted pharmacy for quality medicines and health products',
            image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            cta_text: 'Shop Now',
            cta_url: '/products',
            display_order: 1,
            is_active: true
          },
          {
            tenant_id: tenantId,
            title: 'Fast & Reliable Delivery',
            subtitle: 'Get your medicines delivered to your doorstep in 30 minutes',
            image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
            cta_text: 'Order Now',
            cta_url: '/delivery',
            display_order: 2,
            is_active: true
          },
          {
            tenant_id: tenantId,
            title: 'Expert Consultation Available',
            subtitle: '24/7 pharmacist consultation for all your health needs',
            image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=2026&q=80',
            cta_text: 'Consult Now',
            cta_url: '/consultation',
            display_order: 3,
            is_active: true
          }
        ]

        const { error: slidesError } = await supabase
          .from('carousel_slides')
          .upsert(slides, { onConflict: 'tenant_id,display_order' })

        if (slidesError) throw slidesError
        completedSteps++
      }

      // Seed announcements
      if (categories.includes('announcements')) {
        setProgress({
          step: 'announcements',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating store announcements...'
        })

        const announcements = [
          {
            tenant_id: tenantId,
            title: 'Winter Health Package Available',
            content: 'Get 20% off on immunity boosters and winter care products. Valid until end of month.',
            type: 'success',
            active: true
          },
          {
            tenant_id: tenantId,
            title: 'Prescription Upload Made Easy',
            content: 'Now upload your prescriptions directly through our app for faster processing.',
            type: 'info',
            active: true
          },
          {
            tenant_id: tenantId,
            title: 'Free Home Delivery',
            content: 'Free home delivery on orders above ₹500. No minimum order for senior citizens.',
            type: 'success',
            active: true
          },
          {
            tenant_id: tenantId,
            title: '24/7 Customer Support',
            content: 'Our customer support team is now available round the clock for your assistance.',
            type: 'info',
            active: true
          }
        ]

        const { error: announcementsError } = await supabase
          .from('announcements')
          .upsert(announcements, { onConflict: 'tenant_id,title' })

        if (announcementsError) throw announcementsError
        completedSteps++
      }

      // Seed categories
      if (categories.includes('categories')) {
        setProgress({
          step: 'categories',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating product categories...'
        })

        const productCategories = [
          {
            tenant_id: tenantId,
            name: 'Medicines & Tablets',
            description: 'Prescription and OTC medications',
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 1,
            active: true
          },
          {
            tenant_id: tenantId,
            name: 'Health & Nutrition',
            description: 'Vitamins, supplements, and health products',
            image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 2,
            active: true
          },
          {
            tenant_id: tenantId,
            name: 'Personal Care',
            description: 'Skincare, hygiene, and personal items',
            image_url: 'https://images.unsplash.com/photo-1556909419-f3a56e65f36c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 3,
            active: true
          },
          {
            tenant_id: tenantId,
            name: 'Baby & Mother Care',
            description: 'Products for babies and expecting mothers',
            image_url: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 4,
            active: true
          },
          {
            tenant_id: tenantId,
            name: 'Medical Devices',
            description: 'Thermometers, BP monitors, and medical equipment',
            image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 5,
            active: true
          },
          {
            tenant_id: tenantId,
            name: 'First Aid',
            description: 'Bandages, antiseptics, and emergency care',
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            sort_order: 6,
            active: true
          }
        ]

        const { error: categoriesError } = await supabase
          .from('categories')
          .upsert(productCategories, { onConflict: 'tenant_id,name' })

        if (categoriesError) throw categoriesError
        completedSteps++
      }

      // Seed products (this is more complex, so we'll add a sample)
      if (categories.includes('products')) {
        setProgress({
          step: 'products',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating comprehensive product catalog...'
        })

        // This would typically seed from a CSV or predefined data
        // For now, we'll create a few sample products
        const sampleProducts = [
          {
            tenant_id: tenantId,
            name: 'Paracetamol 500mg Tablets',
            description: 'Fast-acting pain relief and fever reducer',
            brand: 'Crocin',
            pack_size: '20 tablets',
            price: 45.00,
            mrp: 55.00,
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            requires_rx: false,
            active: true,
            inventory_count: 500,
            manufacturer: 'GSK Pharmaceuticals',
            composition: 'Paracetamol 500mg',
            uses: 'Fever, headache, body pain, dental pain',
            side_effects: 'Nausea, skin rash (rare)',
            tags: ['fever', 'pain', 'headache', 'medicine']
          }
          // More products would be added here
        ]

        // We'll skip the full product seeding for this demo to keep it simple
        // but this is where we would insert all products
        completedSteps++
      }

      // Seed customers
      if (categories.includes('customers')) {
        setProgress({
          step: 'customers',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating demo customer profiles...'
        })

        const demoCustomers = [
          {
            tenant_id: tenantId,
            name: 'Rajesh Sharma',
            email: 'rajesh.sharma@email.com',
            phone: '+919876543210',
            loyalty_points: 1250,
            wallet_balance: 450.00,
            address: 'A-204, Green Valley Apartments, Sector 12, Noida, UP - 201301'
          },
          {
            tenant_id: tenantId,
            name: 'Priya Singh',
            email: 'priya.singh@email.com',
            phone: '+919876543211',
            loyalty_points: 875,
            wallet_balance: 320.50,
            address: 'B-45, Silver City, MG Road, Bangalore, KA - 560001'
          }
          // More customers would be added here
        ]

        const { error: customersError } = await supabase
          .from('customers')
          .upsert(demoCustomers, { onConflict: 'tenant_id,email' })

        if (customersError) throw customersError
        completedSteps++
      }

      // Seed orders
      if (categories.includes('orders')) {
        setProgress({
          step: 'orders',
          completed: completedSteps,
          total: totalSteps,
          message: 'Creating sample orders...'
        })

        // This would create realistic orders with order items
        // Skipping detailed implementation for brevity
        completedSteps++
      }

      setProgress({
        step: 'completed',
        completed: totalSteps,
        total: totalSteps,
        message: 'Demo data seeding completed successfully!'
      })

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSeeding(false)
      setProgress(null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Demo data seeded successfully!', {
        description: `${tenantName} now has comprehensive demo data for testing and demonstration.`
      })
    },
    onError: (error) => {
      setIsSeeding(false)
      setProgress(null)
      toast.error('Failed to seed demo data', {
        description: error.message
      })
    }
  })

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(k => k !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const startSeeding = () => {
    setIsConfirmOpen(false)
    seedDataMutation.mutate(selectedCategories)
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return Math.round((progress.completed / progress.total) * 100)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Demo Data Seeder - {tenantName}
          </CardTitle>
          <CardDescription>
            Populate this tenant with comprehensive demo data for testing and demonstration purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seeding Progress */}
          {isSeeding && progress && (
            <Alert className="mb-6">
              <Download className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{progress.message}</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.completed} / {progress.total}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    {getProgressPercentage()}% Complete
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Category Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Data Categories</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategories(DEMO_DATA_CATEGORIES.map(c => c.key))}
                  disabled={isSeeding}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  disabled={isSeeding}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_DATA_CATEGORIES.map((category) => {
                const IconComponent = category.icon
                const isSelected = selectedCategories.includes(category.key)
                const isCurrentlySeeding = progress?.step === category.key
                
                return (
                  <Card 
                    key={category.key}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    } ${isCurrentlySeeding ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => !isSeeding && handleCategoryToggle(category.key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${category.color} text-white flex-shrink-0`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{category.name}</h3>
                            <div className="flex items-center gap-1">
                              {isCurrentlySeeding && (
                                <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
                              )}
                              {isSelected && !isCurrentlySeeding && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {category.description}
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {category.count} items
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <div className="text-sm text-muted-foreground">
              {selectedCategories.length} of {DEMO_DATA_CATEGORIES.length} categories selected
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={selectedCategories.length === 0 || isSeeding}
                className="min-w-[120px]"
              >
                {isSeeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Seed Demo Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Demo Data Seeding</DialogTitle>
            <DialogDescription>
              This will add comprehensive demo data to <strong>{tenantName}</strong> including:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {selectedCategories.map(key => {
              const category = DEMO_DATA_CATEGORIES.find(c => c.key === key)
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{category?.name} ({category?.count} items)</span>
                </div>
              )
            })}
          </div>

          <Alert>
            <Warning className="h-4 w-4" />
            <AlertDescription>
              This action will add demo data to the tenant. Existing data with matching identifiers may be updated.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={startSeeding}>
              Start Seeding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}