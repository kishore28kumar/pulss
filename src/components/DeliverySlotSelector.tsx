import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Clock,
  Calendar as CalendarIcon,
  Truck,
  Zap,
  MapPin,
  AlertCircle,
  CheckCircle
} from '@phosphor-icons/react'
import { format, addDays, isToday, isTomorrow, isAfter, startOfDay } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { DeliverySlot, OrderDeliverySlot, FeatureFlags } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DeliverySlotSelectorProps {
  tenantId: string
  onSlotSelect: (slot: DeliverySlot, date: Date, timeRange: string) => void
  selectedSlot?: { slot: DeliverySlot; date: Date; timeRange: string } | null
  className?: string
}

interface SlotAvailability {
  slot: DeliverySlot
  availableDates: Date[]
  maxOrdersPerSlot: number
  currentOrders: { [key: string]: number } // date string -> order count
}

export const DeliverySlotSelector: React.FC<DeliverySlotSelectorProps> = ({
  tenantId,
  onSlotSelect,
  selectedSlot,
  className
}) => {
  const [deliverySlots, setDeliverySlots] = useState<SlotAvailability[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)

  useEffect(() => {
    loadFeatureFlags()
  }, [tenantId])

  useEffect(() => {
    if (featureFlags?.delivery_slots_enabled) {
      loadDeliverySlots()
    }
  }, [featureFlags, tenantId])

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

  const loadDeliverySlots = async () => {
    setLoading(true)
    try {
      // Load delivery slots
      const { data: slots, error: slotsError } = await supabase
        .from('delivery_slots')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('slot_type')
        .order('delivery_fee')

      if (slotsError) throw slotsError

      // Load current orders for each slot
      const currentOrdersData = await Promise.all(
        (slots || []).map(async (slot) => {
          const { data: orders } = await supabase
            .from('order_delivery_slots')
            .select('preferred_date, order_id')
            .eq('slot_id', slot.id)
            .gte('preferred_date', format(new Date(), 'yyyy-MM-dd'))

          const orderCounts: { [key: string]: number } = {}
          orders?.forEach(order => {
            const dateKey = order.preferred_date
            orderCounts[dateKey] = (orderCounts[dateKey] || 0) + 1
          })

          // Generate available dates based on slot configuration
          const availableDates: Date[] = []
          const today = new Date()
          
          // Generate dates for the next 14 days
          for (let i = slot.days_offset; i < 14; i++) {
            const date = addDays(today, i)
            // Skip if this slot is fully booked on this date
            const dateKey = format(date, 'yyyy-MM-dd')
            if ((orderCounts[dateKey] || 0) < slot.max_orders) {
              availableDates.push(date)
            }
          }

          return {
            slot,
            availableDates,
            maxOrdersPerSlot: slot.max_orders,
            currentOrders: orderCounts
          }
        })
      )

      setDeliverySlots(currentOrdersData)
    } catch (error) {
      console.error('Error loading delivery slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSlotTypeInfo = (slotType: string) => {
    switch (slotType) {
      case 'same_day':
        return {
          icon: Zap,
          label: 'Same Day',
          description: 'Delivered today',
          color: 'bg-green-500'
        }
      case 'express':
        return {
          icon: Truck,
          label: 'Express',
          description: 'Fast delivery',
          color: 'bg-blue-500'
        }
      case 'scheduled':
        return {
          icon: Calendar,
          label: 'Scheduled',
          description: 'Choose your time',
          color: 'bg-purple-500'
        }
      default:
        return {
          icon: Clock,
          label: 'Standard',
          description: 'Regular delivery',
          color: 'bg-gray-500'
        }
    }
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  const isSlotAvailableOnDate = (slotAvailability: SlotAvailability, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const currentOrders = slotAvailability.currentOrders[dateKey] || 0
    return currentOrders < slotAvailability.maxOrdersPerSlot
  }

  const getAvailableSlotsForDate = (date: Date) => {
    return deliverySlots.filter(slotAvail => 
      slotAvail.availableDates.some(availDate => 
        format(availDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ) && isSlotAvailableOnDate(slotAvail, date)
    )
  }

  const handleSlotSelection = (slotAvailability: SlotAvailability, date: Date) => {
    onSlotSelect(slotAvailability.slot, date, slotAvailability.slot.time_range)
  }

  if (!featureFlags?.delivery_slots_enabled) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Choose Delivery Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : deliverySlots.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No delivery slots available</p>
          </div>
        ) : (
          <>
            {/* Date Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Date</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(new Date(), i)
                  const availableSlots = getAvailableSlotsForDate(date)
                  const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  
                  return (
                    <Button
                      key={i}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      disabled={availableSlots.length === 0}
                      className="flex-shrink-0 flex flex-col h-auto py-2 px-3 min-w-[80px]"
                    >
                      <span className="text-xs font-medium">{getDateLabel(date)}</span>
                      <span className="text-xs opacity-75">{format(date, 'MMM d')}</span>
                      {availableSlots.length > 0 && (
                        <Badge variant="secondary" className="mt-1 text-xs px-1 py-0">
                          {availableSlots.length} slots
                        </Badge>
                      )}
                    </Button>
                  )
                })}
                
                {/* More dates option */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => {
                        const availableSlots = getAvailableSlotsForDate(date)
                        return isAfter(startOfDay(new Date()), date) || availableSlots.length === 0
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Available Slots for Selected Date */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Available Slots for {getDateLabel(selectedDate)}
              </Label>
              
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  <AnimatePresence>
                    {getAvailableSlotsForDate(selectedDate).map((slotAvailability) => {
                      const slotInfo = getSlotTypeInfo(slotAvailability.slot.slot_type)
                      const Icon = slotInfo.icon
                      const dateKey = format(selectedDate, 'yyyy-MM-dd')
                      const currentOrders = slotAvailability.currentOrders[dateKey] || 0
                      const remainingSlots = slotAvailability.maxOrdersPerSlot - currentOrders
                      
                      const isSelected = selectedSlot?.slot.id === slotAvailability.slot.id &&
                        format(selectedSlot.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')

                      return (
                        <motion.div
                          key={slotAvailability.slot.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className={`transition-all hover:shadow-md cursor-pointer ${
                              isSelected ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => handleSlotSelection(slotAvailability, selectedDate)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${slotInfo.color} text-white`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{slotInfo.label}</h4>
                                    {slotAvailability.slot.delivery_fee > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        +₹{slotAvailability.slot.delivery_fee}
                                      </Badge>
                                    )}
                                    {slotAvailability.slot.delivery_fee === 0 && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {slotAvailability.slot.time_range}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {slotInfo.description} • {remainingSlots} slots remaining
                                  </p>
                                </div>

                                <div className="text-right">
                                  {isSelected ? (
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  
                  {getAvailableSlotsForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No slots available for this date</p>
                      <p className="text-sm text-muted-foreground">Please select a different date</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Selected Slot Summary */}
            {selectedSlot && (
              <div className="border-t pt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Selected Delivery Slot</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {getSlotTypeInfo(selectedSlot.slot.slot_type).label} delivery on{' '}
                    {getDateLabel(selectedSlot.date)} between {selectedSlot.timeRange}
                    {selectedSlot.slot.delivery_fee > 0 && (
                      <span> (Additional ₹{selectedSlot.slot.delivery_fee} delivery charge)</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div className="border-t pt-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>• Same day delivery is available for orders placed before 2 PM</p>
                  <p>• Express delivery is available within 2-4 hours</p>
                  <p>• Scheduled delivery allows you to choose your preferred time</p>
                  <p>• Delivery charges may apply based on location and slot type</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default DeliverySlotSelector