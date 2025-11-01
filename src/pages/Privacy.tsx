import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Shield, Cookie, Database, FileText, Clock, AlertTriangle } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { DPDPCompliance } from '@/components/DPDPCompliance'
import { GrievanceRedressal } from '@/components/GrievanceRedressal'
import { PrivacySettings } from '@/components/PrivacySettings'
import { DataProcessingNotice } from '@/components/DataProcessingNotice'
import { DataRetentionPolicy } from '@/components/DataRetentionPolicy'

export const Privacy = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Privacy & Data Protection</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your privacy is important to us. Manage your data rights, cookie preferences, 
              and understand how we process your information in compliance with India's 
              Digital Personal Data Protection Act, 2023 (DPDP Act).
            </p>
          </div>

          {/* Tabs for different privacy sections */}
          <Tabs defaultValue="rights" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
              <TabsTrigger value="rights" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Your Rights</span>
                <span className="sm:hidden">Rights</span>
              </TabsTrigger>
              <TabsTrigger value="grievance" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Grievance</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger value="cookies" className="flex items-center gap-2">
                <Cookie className="w-4 h-4" />
                Cookies
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Data Processing</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger value="retention" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Retention
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Legal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rights" className="mt-6">
              <DPDPCompliance />
            </TabsContent>

            <TabsContent value="grievance" className="mt-6">
              <GrievanceRedressal />
            </TabsContent>

            <TabsContent value="cookies" className="mt-6">
              <PrivacySettings />
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <DataProcessingNotice />
            </TabsContent>

            <TabsContent value="retention" className="mt-6">
              <DataRetentionPolicy />
            </TabsContent>

            <TabsContent value="legal" className="mt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Legal Documents</h3>
                  <p className="text-muted-foreground">
                    Access our complete legal documentation and privacy policies compliant with 
                    India's DPDP Act, 2023.
                  </p>
                </div>
                <Button onClick={() => navigate('/legal')} size="lg">
                  View Complete Legal Information & Privacy Policy
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}