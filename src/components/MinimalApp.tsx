import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const MinimalApp = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold">Pulss Store</h1>
            </div>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Pulss</h2>
          <p className="text-muted-foreground mb-6">
            Your trusted white-label e-commerce platform
          </p>
          <Button size="lg">
            Get Started
          </Button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-semibold mb-6 text-center">Access Portals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Super Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">Manage all tenants and global settings</p>
                <Button asChild className="w-full">
                  <a href="/super">Access Portal</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Business Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">Manage your store and products</p>
                <Button asChild className="w-full">
                  <a href="/admin">Access Portal</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Customer Store</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">Shop for products and services</p>
                <Button asChild className="w-full">
                  <a href="/store">Browse Store</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Delivery Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">Manage delivery orders</p>
                <Button asChild className="w-full">
                  <a href="/delivery">Access Portal</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* System Health */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-6">System Status</h3>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Database</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>API Services</span>
                  <span className="text-green-600">Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-green-600">Healthy</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <a href="/health">View Details</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            © 2024 Pulss. All rights reserved.
          </p>
          <div className="space-x-4">
            <Button variant="link" size="sm" asChild>
              <a href="/legal">Terms</a>
            </Button>
            <Button variant="link" size="sm" asChild>
              <a href="/privacy">Privacy</a>
            </Button>
            <Button variant="link" size="sm" asChild>
              <a href="/help">Help</a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}