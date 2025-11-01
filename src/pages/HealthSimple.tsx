import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, XCircle } from '@phosphor-icons/react'

export const Health = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  const isConfigured = supabaseUrl && supabaseKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseKey !== 'placeholder-key'

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pulss Health Check</h1>
          <p className="text-muted-foreground">System status and configuration</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConfigured ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <span>Supabase URL</span>
                <span className={isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {supabaseUrl ? 'Configured' : 'Missing'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <span>Supabase Key</span>
                <span className={isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {supabaseKey ? 'Configured' : 'Missing'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <span>Overall Status</span>
                <span className={isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {isConfigured ? 'Ready' : 'Setup Required'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild variant="outline">
              <a href="/super">Super Admin</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/admin">Admin Portal</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/">Customer Store</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/delivery">Delivery</a>
            </Button>
          </div>
          
          {!isConfigured && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Setup Required</h3>
              <p className="text-red-700 text-sm mb-4">
                Please configure your Supabase credentials in the .env.local file
              </p>
              <pre className="text-xs bg-red-100 p-3 rounded text-left">
                VITE_SUPABASE_URL=your_supabase_url{'\n'}
                VITE_SUPABASE_ANON_KEY=your_anon_key
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}