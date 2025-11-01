import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Heart,
  Star,
  Phone,
  User,
  Navigation
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CustomerAddress, FeatureFlags } from '@/types'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'

interface AddressBookProps {
  tenantId: string
  customerId: string
  isOpen: boolean
  onClose: () => void
  onAddressSelect?: (address: CustomerAddress) => void
  selectionMode?: boolean
}

interface AddressFormData {
  label: string
  recipient_name: string
  phone: string
  address_line1: string
  address_line2: string
  landmark: string
  city: string
  state: string
  pincode: string
  country: string
  is_default: boolean
}

const defaultFormData: AddressFormData = {
  label: '',
  recipient_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  is_default: false
}

const ADDRESS_LABELS = [
  { value: 'Home', icon: Home, color: 'bg-green-500' },
  { value: 'Office', icon: Building, color: 'bg-blue-500' },
  { value: 'Mom\'s place', icon: Heart, color: 'bg-pink-500' },
  { value: 'Dad\'s place', icon: Heart, color: 'bg-purple-500' },
  { value: 'Friend\'s place', icon: Star, color: 'bg-yellow-500' },
  { value: 'Other', icon: MapPin, color: 'bg-gray-500' }
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

export const AddressBook: React.FC<AddressBookProps> = ({
  tenantId,
  customerId,
  isOpen,
  onClose,
  onAddressSelect,
  selectionMode = false
}) => {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(defaultFormData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadFeatureFlags()
      loadAddresses()
    }
  }, [isOpen, customerId])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadAddresses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      toast.error('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    setFormData(defaultFormData)
    setIsFormOpen(true)
  }

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      is_default: address.is_default
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error

      toast.success('Address deleted successfully')
      loadAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // First, unset all addresses as default
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)

      // Then set the selected address as default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error

      toast.success('Default address updated')
      loadAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error('Failed to update default address')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const addressData = {
        ...formData,
        customer_id: customerId
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('customer_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)

        if (error) throw error
        toast.success('Address updated successfully')
      } else {
        // Create new address
        // If this is the first address or set as default, unset other defaults
        if (formData.is_default || addresses.length === 0) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', customerId)
            
          addressData.is_default = true
        }

        const { error } = await supabase
          .from('customer_addresses')
          .insert([addressData])

        if (error) throw error
        toast.success('Address added successfully')
      }

      setIsFormOpen(false)
      setFormData(defaultFormData)
      loadAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const validatePincode = (pincode: string) => {
    return /^[1-9][0-9]{5}$/.test(pincode)
  }

  const validatePhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone)
  }

  const getAddressIcon = (label: string) => {
    const labelConfig = ADDRESS_LABELS.find(l => l.value === label)
    return labelConfig || ADDRESS_LABELS[ADDRESS_LABELS.length - 1]
  }

  const formatAddress = (address: CustomerAddress) => {
    const parts = [
      address.address_line1,
      address.address_line2,
      address.landmark,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean)

    return parts.join(', ')
  }

  if (!featureFlags?.address_book_enabled) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {selectionMode ? 'Select Address' : 'Address Book'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 max-h-[calc(90vh-8rem)] overflow-hidden">
          {/* Address List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Saved Addresses</h3>
              {!selectionMode && (
                <Button onClick={handleAddNew} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              )}
            </div>

            <ScrollArea className="h-96 lg:h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : addresses.length === 0 ? (
                <Card className="p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No addresses saved yet</p>
                  <Button onClick={handleAddNew} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {addresses.map((address) => {
                      const iconConfig = getAddressIcon(address.label)
                      const Icon = iconConfig.icon

                      return (
                        <motion.div
                          key={address.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className={`transition-all hover:shadow-md cursor-pointer ${
                            selectionMode ? 'hover:border-primary' : ''
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${iconConfig.color} text-white flex-shrink-0`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">{address.label}</h4>
                                    {address.is_default && (
                                      <Badge variant="secondary" className="text-xs">
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="font-medium text-sm">{address.recipient_name}</p>
                                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formatAddress(address)}
                                  </p>
                                </div>

                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {selectionMode ? (
                                    <Button
                                      size="sm"
                                      onClick={() => onAddressSelect && onAddressSelect(address)}
                                      variant="outline"
                                    >
                                      Select
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(address)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(address.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      {!address.is_default && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleSetDefault(address.id)}
                                          className="text-xs"
                                        >
                                          Set Default
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Add/Edit Form */}
          {isFormOpen && (
            <div className="flex-1 lg:border-l lg:pl-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2"
                >
                  ×
                </Button>
              </div>

              <ScrollArea className="h-96 lg:h-[500px]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Address Label */}
                  <div>
                    <Label htmlFor="label">Address Label</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {ADDRESS_LABELS.map((label) => {
                        const Icon = label.icon
                        return (
                          <button
                            key={label.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, label: label.value }))}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              formData.label === label.value
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">{label.value}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {formData.label === 'Other' && (
                    <div>
                      <Label htmlFor="custom-label">Custom Label</Label>
                      <Input
                        id="custom-label"
                        value={formData.label === 'Other' ? '' : formData.label}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Enter custom label"
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient_name">Recipient Name *</Label>
                      <Input
                        id="recipient_name"
                        value={formData.recipient_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="10-digit mobile number"
                        pattern="[6-9][0-9]{9}"
                        required
                      />
                      {formData.phone && !validatePhone(formData.phone) && (
                        <p className="text-xs text-destructive mt-1">
                          Please enter a valid 10-digit mobile number
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Address Details */}
                  <div>
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                      placeholder="House/Flat/Building No, Street"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                      placeholder="Area, Locality"
                    />
                  </div>

                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                      placeholder="Nearby landmark (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <select
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                        placeholder="6-digit PIN"
                        pattern="[1-9][0-9]{5}"
                        required
                      />
                      {formData.pincode && !validatePincode(formData.pincode) && (
                        <p className="text-xs text-destructive mt-1">
                          Please enter a valid 6-digit PIN code
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Default Address Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default">Set as default address</Label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={saving} className="flex-1">
                      {saving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFormOpen(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddressBook