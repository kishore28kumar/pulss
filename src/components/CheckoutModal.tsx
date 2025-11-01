import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RxUpload } from '@/components/RxUpload'
import { 
  CreditCard, 
  Wallet, 
  Money as Cash, 
  QrCode, 
  MapPin, 
  Phone, 
  User, 
  FileText,
  Gift,
  Stethoscope,
  Upload,
  CheckCircle,
  Bank,
  DeviceMobile,
  GoogleLogo,
  AppleLogo
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/useAuth'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  requires_rx: boolean
  image_url?: string
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onOrderComplete: (orderId: string) => void
  chemistSettings?: any
}

interface AddressForm {
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  landmark?: string
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderComplete,
  chemistSettings
}) => {
  const { user } = useAuth()
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | 'cash' | 'card' | 'credit' | 'wallet' | 'netbanking'>('cod')
  const [address, setAddress] = useState<AddressForm>({
    name: (user as any)?.name || '',
    phone: (user as any)?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  })
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [useWallet, setUseWallet] = useState(false)
  const [walletBalance] = useState(0) // This would come from API
  const [loyaltyPoints] = useState(0) // This would come from API
  const [useLoyalty, setUseLoyalty] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [prescriptionFiles, setPrescriptionFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal * 0.5) : 0
  const loyaltyDiscount = useLoyalty ? Math.min(loyaltyPoints * 0.1, subtotal * 0.1) : 0
  const walletAmount = useWallet ? Math.min(walletBalance, subtotal - discount) : 0
  const deliveryFee = subtotal > 500 ? 0 : 50
  const total = Math.max(0, subtotal - discount - loyaltyDiscount - walletAmount + deliveryFee)

  const requiresPrescription = cartItems.some(item => item.requires_rx)

  const handleAddressSubmit = () => {
    if (!address.name || !address.phone || !address.address || !address.city || !address.pincode) {
      toast.error('Please fill all required fields')
      return
    }
    if (address.phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    setStep('payment')
  }

  const handleCouponApply = async () => {
    if (!couponCode.trim()) return
    
    // Mock coupon validation - replace with actual API call
    const mockCoupons = [
      { code: 'SAVE10', discount: subtotal * 0.1, type: 'percentage' },
      { code: 'FLAT50', discount: 50, type: 'flat' },
      { code: 'WELCOME', discount: subtotal * 0.15, type: 'percentage' }
    ]
    
    const coupon = mockCoupons.find(c => c.code === couponCode.toUpperCase())
    if (coupon) {
      setAppliedCoupon(coupon)
      toast.success(`Coupon applied! You saved ₹${coupon.discount}`)
    } else {
      toast.error('Invalid coupon code')
    }
  }

  const handlePrescriptionUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!isValid) {
        toast.error(`${file.name} is not a valid format. Please upload images or PDF files.`)
      }
      return isValid && file.size <= 5 * 1024 * 1024 // 5MB limit
    })
    
    setPrescriptionFiles([...prescriptionFiles, ...validFiles])
    toast.success(`${validFiles.length} prescription file(s) uploaded`)
  }

  const handleOrderSubmit = async () => {
    if (requiresPrescription && prescriptionFiles.length === 0) {
      toast.error('Please upload prescription for Rx required medicines')
      return
    }

    setIsProcessing(true)
    
    try {
      // Mock order creation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const orderId = `PLS${Date.now()}`
      
      toast.success('Order placed successfully!', {
        description: `Order ID: ${orderId}`,
        duration: 5000
      })
      
      onOrderComplete(orderId)
      onClose()
    } catch (error) {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'upi': return <QrCode className="h-5 w-5" />
      case 'card': return <CreditCard className="h-5 w-5" />
      case 'wallet': return <Wallet className="h-5 w-5" />
      case 'netbanking': return <Bank className="h-5 w-5" />
      case 'cash':
      case 'cod': return <Cash className="h-5 w-5" />
      case 'credit': return <FileText className="h-5 w-5" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('address')
      setPaymentMethod('cod')
      setCouponCode('')
      setAppliedCoupon(null)
      setUseWallet(false)
      setUseLoyalty(false)
      setSpecialInstructions('')
      setPrescriptionFiles([])
      setIsProcessing(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'address' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>1</div>
              <div className="w-8 h-1 bg-muted mx-2">
                <div className={`h-full bg-primary transition-all duration-300 ${
                  step !== 'address' ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>2</div>
              <div className="w-8 h-1 bg-muted mx-2">
                <div className={`h-full bg-primary transition-all duration-300 ${
                  step === 'review' ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>3</div>
            </div>
            <span className="ml-4">
              {step === 'address' && 'Delivery Address'}
              {step === 'payment' && 'Payment Method'}
              {step === 'review' && 'Review Order'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'address' && (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={address.name}
                    onChange={(e) => setAddress({...address, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={address.phone}
                    onChange={(e) => setAddress({...address, phone: e.target.value})}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({...address, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={address.address}
                    onChange={(e) => setAddress({...address, address: e.target.value})}
                    placeholder="House/Flat no, Building name, Street"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    placeholder="City name"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={address.state} onValueChange={(value) => setAddress({...address, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AP">Andhra Pradesh</SelectItem>
                      <SelectItem value="AR">Arunachal Pradesh</SelectItem>
                      <SelectItem value="AS">Assam</SelectItem>
                      <SelectItem value="BR">Bihar</SelectItem>
                      <SelectItem value="CT">Chhattisgarh</SelectItem>
                      <SelectItem value="GA">Goa</SelectItem>
                      <SelectItem value="GJ">Gujarat</SelectItem>
                      <SelectItem value="HR">Haryana</SelectItem>
                      <SelectItem value="HP">Himachal Pradesh</SelectItem>
                      <SelectItem value="JK">Jammu and Kashmir</SelectItem>
                      <SelectItem value="JH">Jharkhand</SelectItem>
                      <SelectItem value="KA">Karnataka</SelectItem>
                      <SelectItem value="KL">Kerala</SelectItem>
                      <SelectItem value="MP">Madhya Pradesh</SelectItem>
                      <SelectItem value="MH">Maharashtra</SelectItem>
                      <SelectItem value="MN">Manipur</SelectItem>
                      <SelectItem value="ML">Meghalaya</SelectItem>
                      <SelectItem value="MZ">Mizoram</SelectItem>
                      <SelectItem value="NL">Nagaland</SelectItem>
                      <SelectItem value="OR">Odisha</SelectItem>
                      <SelectItem value="PB">Punjab</SelectItem>
                      <SelectItem value="RJ">Rajasthan</SelectItem>
                      <SelectItem value="SK">Sikkim</SelectItem>
                      <SelectItem value="TN">Tamil Nadu</SelectItem>
                      <SelectItem value="TG">Telangana</SelectItem>
                      <SelectItem value="TR">Tripura</SelectItem>
                      <SelectItem value="UP">Uttar Pradesh</SelectItem>
                      <SelectItem value="UT">Uttarakhand</SelectItem>
                      <SelectItem value="WB">West Bengal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={address.pincode}
                    onChange={(e) => setAddress({...address, pincode: e.target.value})}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={address.landmark}
                    onChange={(e) => setAddress({...address, landmark: e.target.value})}
                    placeholder="Nearby landmark (optional)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleAddressSubmit} className="min-w-[150px]">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Cash className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                        <QrCode className="h-5 w-5" />
                        <div>
                          <div className="font-medium">UPI Payment</div>
                          <div className="text-sm text-muted-foreground">GPay, PhonePe, Paytm, BHIM - Instant & Secure</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-muted-foreground">Visa, Mastercard, RuPay - Safe & Encrypted</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="netbanking" id="netbanking" />
                      <Label htmlFor="netbanking" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Bank className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Net Banking</div>
                          <div className="text-sm text-muted-foreground">Direct bank transfer - All major banks</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Wallet className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Digital Wallet</div>
                          <div className="text-sm text-muted-foreground">Paytm, PhonePe, Amazon Pay, JioMoney</div>
                        </div>
                      </Label>
                    </div>
                    
                    {(chemistSettings?.credit_on_delivery_enabled || chemistSettings?.allow_credit || true) && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex items-center gap-3 cursor-pointer flex-1">
                          <FileText className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Credit (Pay Later)</div>
                            <div className="text-sm text-muted-foreground">
                              Subject to approval
                              {chemistSettings?.credit_limit && ` - Credit limit: ₹${chemistSettings.credit_limit.toLocaleString()}`}
                            </div>
                          </div>
                          <Badge variant="secondary">Approval Required</Badge>
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Offers & Coupons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Offers & Coupons</h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleCouponApply}>
                    Apply
                  </Button>
                </div>
                
                {appliedCoupon && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">
                      Coupon applied! You saved ₹{appliedCoupon.discount}
                    </span>
                  </div>
                )}

                {walletBalance > 0 && (
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="wallet"
                      checked={useWallet}
                      onCheckedChange={(checked) => setUseWallet(checked === true)}
                    />
                    <Label htmlFor="wallet">
                      Use Wallet Balance (₹{walletBalance} available)
                    </Label>
                  </div>
                )}

                {loyaltyPoints > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="loyalty"
                      checked={useLoyalty}
                      onCheckedChange={(checked) => setUseLoyalty(checked === true)}
                    />
                    <Label htmlFor="loyalty">
                      Use Loyalty Points ({loyaltyPoints} points = ₹{loyaltyPoints * 0.1})
                    </Label>
                  </div>
                )}
              </div>

              {requiresPrescription && (
                <div>
                  <RxUpload
                    maxFiles={5}
                    required={requiresPrescription}
                    onUploadComplete={(urls) => {
                      console.log('Prescription files uploaded:', urls)
                      toast.success('Prescription uploaded successfully')
                    }}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('address')}>
                  Back to Address
                </Button>
                <Button onClick={() => setStep('review')}>
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{address.name}</div>
                        <div>{address.phone}</div>
                        <div>{address.address}</div>
                        <div>{address.city}, {address.state} - {address.pincode}</div>
                        {address.landmark && <div>Near {address.landmark}</div>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getPaymentIcon(paymentMethod)}
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {paymentMethod === 'cod' && 'Cash on Delivery'}
                        {paymentMethod === 'upi' && 'UPI Payment'}
                        {paymentMethod === 'card' && 'Credit/Debit Card'}
                        {paymentMethod === 'netbanking' && 'Net Banking'}
                        {paymentMethod === 'wallet' && 'Digital Wallet'}
                        {paymentMethod === 'credit' && 'Credit (Pay Later)'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-muted-foreground">Qty: {item.quantity}</div>
                          </div>
                          <div>₹{item.price * item.quantity}</div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon Discount</span>
                          <span>-₹{discount}</span>
                        </div>
                      )}
                      {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Loyalty Discount</span>
                          <span>-₹{loyaltyDiscount}</span>
                        </div>
                      )}
                      {walletAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Wallet</span>
                          <span>-₹{walletAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('payment')}>
                  Back to Payment
                </Button>
                <Button 
                  onClick={handleOrderSubmit} 
                  disabled={isProcessing}
                  className="min-w-[150px]"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Place Order - ₹${total}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}