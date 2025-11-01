import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CreditCard, QrCode, Wallet, CheckCircle, X } from '@phosphor-icons/react'
import QRCodeLib from 'qrcode'

interface PaymentOptionsPreviewProps {
  upiId: string
  upiIdValid: boolean
  razorpayKeyId?: string
  razorpayKeyIdValid?: boolean
  businessName: string
}

export const PaymentOptionsPreview: React.FC<PaymentOptionsPreviewProps> = ({
  upiId,
  upiIdValid,
  razorpayKeyId,
  razorpayKeyIdValid,
  businessName
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')

  React.useEffect(() => {
    if (upiIdValid && upiId) {
      // Generate UPI QR code
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&cu=INR`
      QRCodeLib.toDataURL(upiLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url)
      }).catch(err => {
        console.error('QR code generation error:', err)
      })
    }
  }, [upiId, upiIdValid, businessName])

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Payment Options Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Available payment methods for your customers:
        </p>

        {/* UPI Payment */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-sm">UPI Payment</span>
            </div>
            {upiIdValid ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                <X className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          {upiIdValid && qrCodeUrl ? (
            <div className="flex flex-col items-center space-y-2">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40" />
              <p className="text-xs text-muted-foreground text-center">
                Scan to pay {businessName}
              </p>
              <p className="text-xs font-mono text-center bg-gray-100 px-2 py-1 rounded">
                {upiId}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded border-2 border-dashed border-gray-300">
              <p className="text-xs text-muted-foreground">Enter valid UPI ID to see QR code</p>
            </div>
          )}
        </div>

        {/* Razorpay Payment */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-sm">Online Payment (Razorpay)</span>
            </div>
            {razorpayKeyIdValid ? (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                <X className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {razorpayKeyIdValid 
                ? 'Cards, UPI, Wallets, and Net Banking enabled'
                : 'Configure Razorpay to accept online payments'}
            </p>
            {razorpayKeyId && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Key ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                  {razorpayKeyId.substring(0, 15)}...
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Cash on Delivery - Always Available */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-sm">Cash on Delivery</span>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Always Available
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Customers can pay in cash when order is delivered
          </p>
        </div>

        {/* Summary */}
        <div className="p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            {upiIdValid && razorpayKeyIdValid 
              ? '✓ All payment methods configured and ready'
              : upiIdValid
              ? '✓ UPI payments ready. Configure Razorpay for more options.'
              : 'Configure at least UPI to enable online payments'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
