import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LegalDocument, LEGAL_DOCUMENTS } from '@/lib/legal'
import { FileText, Shield, Users, Warning, CheckCircle } from '@phosphor-icons/react'

interface AgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  userRole: 'admin' | 'customer'
  isFirstTime?: boolean
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  userRole,
  isFirstTime = false
}) => {
  const [acceptedDocuments, setAcceptedDocuments] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  const relevantDocuments = LEGAL_DOCUMENTS.filter(
    doc => doc.targetRole === userRole || doc.targetRole === 'all'
  )

  const mandatoryDocuments = relevantDocuments.filter(doc => doc.mandatory)
  const allMandatoryAccepted = mandatoryDocuments.every(doc => acceptedDocuments.has(doc.id))

  const handleDocumentAccept = (documentId: string, accepted: boolean | 'indeterminate') => {
    const newAccepted = new Set(acceptedDocuments)
    if (accepted === true) {
      newAccepted.add(documentId)
    } else {
      newAccepted.delete(documentId)
    }
    setAcceptedDocuments(newAccepted)
  }

  const handleProceed = async () => {
    if (!allMandatoryAccepted || isProcessing) return
    
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 200)) // Shorter delay
      onAccept()
      if (!isFirstTime) {
        onClose()
      }
    } catch (error) {
      console.error('Error accepting agreement:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAcceptedDocuments(new Set())
      setIsProcessing(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={isFirstTime ? () => {} : onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle className="text-2xl">Legal Agreement Required</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isFirstTime 
                  ? "Welcome! Please review and accept the following agreements to continue." 
                  : "Review the updated legal agreements to continue using the platform."
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
          <div className="space-y-6">
            {relevantDocuments.map((document) => (
              <DocumentSection
                key={document.id}
                document={document}
                isAccepted={acceptedDocuments.has(document.id)}
                onAcceptChange={(accepted) => handleDocumentAccept(document.id, accepted)}
              />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t bg-background sticky bottom-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              {allMandatoryAccepted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">All required terms accepted</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <Warning className="h-4 w-4" />
                  <span>
                    {mandatoryDocuments.length - Array.from(acceptedDocuments).filter(id => 
                      mandatoryDocuments.some(doc => doc.id === id)
                    ).length} required agreement(s) remaining
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {!isFirstTime && (
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleProceed}
              disabled={!allMandatoryAccepted || isProcessing}
              size="lg"
              className={`min-w-[160px] ${allMandatoryAccepted ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : allMandatoryAccepted ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Continue to App</span>
                </div>
              ) : (
                'Accept Required Terms'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DocumentSectionProps {
  document: LegalDocument
  isAccepted: boolean
  onAcceptChange: (accepted: boolean | 'indeterminate') => void
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  document,
  isAccepted,
  onAcceptChange
}) => {
  return (
    <div className={`border-2 rounded-lg p-6 space-y-4 transition-all duration-200 ${
      isAccepted 
        ? 'bg-green-50 border-green-200' 
        : document.mandatory 
          ? 'bg-card border-amber-200' 
          : 'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">{document.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Version {document.version} • {document.lastUpdated.toLocaleDateString()}
              </span>
              {document.mandatory && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          </div>
        </div>
        {isAccepted && (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        )}
      </div>

      <ScrollArea className="h-48 border rounded-md p-4 text-sm bg-muted/30">
        <div className="whitespace-pre-wrap leading-relaxed">
          {document.content}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          By checking the box, you acknowledge that you have read and agree to these terms.
        </p>
        <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
          isAccepted ? 'bg-green-100' : 'bg-muted/50 hover:bg-muted'
        }`}>
          <Checkbox
            id={`accept-${document.id}`}
            checked={isAccepted}
            onCheckedChange={onAcceptChange}
            className="h-6 w-6"
          />
          <label 
            htmlFor={`accept-${document.id}`}
            className="text-sm font-medium cursor-pointer select-none"
          >
            I accept these terms
          </label>
        </div>
      </div>
    </div>
  )
}