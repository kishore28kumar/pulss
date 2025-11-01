/**
 * Order Tracking Timeline
 * Visual timeline for order status tracking
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/animations'
import {
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from '@phosphor-icons/react'

interface TimelineEvent {
  id: string
  status: string
  title: string
  description?: string
  timestamp: string
  location?: string
  completed: boolean
}

interface OrderTrackingTimelineProps {
  events: TimelineEvent[]
  currentStatus: string
  className?: string
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  payment: CreditCard,
  processing: Package,
  shipped: Truck,
  outForDelivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  returned: Package,
}

const statusColors = {
  pending: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  confirmed: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  payment: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  processing: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
  shipped: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
  outForDelivery: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  delivered: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  cancelled: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  returned: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
}

export const OrderTrackingTimeline = ({
  events,
  currentStatus,
  className,
}: OrderTrackingTimelineProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative"
        >
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 md:left-8">
            <motion.div
              className="w-full bg-gradient-to-b from-blue-600 to-purple-600"
              initial={{ height: '0%' }}
              animate={{ height: '100%' }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </div>

          {/* Timeline Events */}
          <div className="relative space-y-8">
            {events.map((event, index) => {
              const Icon = statusIcons[event.status as keyof typeof statusIcons] || CheckCircle
              const colorClass = statusColors[event.status as keyof typeof statusColors] || statusColors.pending
              const { date, time } = formatTimestamp(event.timestamp)
              const isLast = index === events.length - 1

              return (
                <motion.div
                  key={event.id}
                  variants={staggerItem}
                  className="relative flex gap-4 md:gap-6"
                >
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full',
                        event.completed ? colorClass : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
                      )}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Icon className="w-6 h-6 md:w-8 md:h-8" weight="bold" />
                    </motion.div>

                    {/* Pulse effect for current status */}
                    {event.status === currentStatus && event.completed && (
                      <motion.div
                        className={cn(
                          'absolute inset-0 rounded-full',
                          colorClass.split(' ')[1]
                        )}
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                      <div>
                        <h3
                          className={cn(
                            'font-semibold text-lg',
                            event.completed
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 md:text-right flex-shrink-0">
                        <div className="font-medium">{date}</div>
                        <div>{time}</div>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {/* Estimated delivery for shipped status */}
                    {event.status === 'shipped' && event.completed && !isLast && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            Estimated delivery: {formatTimestamp(events[index + 1]?.timestamp || event.timestamp).date}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Compact horizontal progress variant
export const CompactOrderProgress = ({
  events,
  currentStatus,
  className,
}: OrderTrackingTimelineProps) => {
  const completedCount = events.filter((e) => e.completed).length

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Order Status</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount} of {events.length} completed
        </span>
      </div>

      {/* Desktop: Horizontal Steps */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ width: '0%' }}
              animate={{
                width: `${((completedCount - 1) / (events.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {events.map((event, index) => {
              const Icon = statusIcons[event.status as keyof typeof statusIcons] || CheckCircle
              const colorClass = statusColors[event.status as keyof typeof statusColors]

              return (
                <div key={event.id} className="flex flex-col items-center max-w-[100px]">
                  <motion.div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2',
                      event.completed
                        ? `${colorClass} border-transparent`
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        event.completed ? '' : 'text-gray-400'
                      )}
                      weight="bold"
                    />
                  </motion.div>

                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Simple Progress Bar */}
      <div className="md:hidden space-y-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
            initial={{ width: '0%' }}
            animate={{
              width: `${(completedCount / events.length) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>

        <div className="space-y-2">
          {events.map((event) => {
            const Icon = statusIcons[event.status as keyof typeof statusIcons] || CheckCircle
            const colorClass = statusColors[event.status as keyof typeof statusColors]

            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  event.completed
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    event.completed ? colorClass : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <Icon
                    className={cn('w-4 h-4', event.completed ? '' : 'text-gray-400')}
                    weight="bold"
                  />
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      event.completed
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {event.title}
                  </div>
                </div>
                {event.completed && (
                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
