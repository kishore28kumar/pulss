/**
 * Enhanced badge components for product labels, notifications, and status indicators
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Badge as BaseBadge } from './badge'
import { cn } from '@/lib/utils'
import { Sparkle, TrendUp, Fire, Lightning, Tag, Star, Check } from '@phosphor-icons/react'

interface EnhancedBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  pulse?: boolean
  glow?: boolean
  className?: string
}

export const EnhancedBadge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  glow = false,
  className 
}: EnhancedBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input bg-background',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const Component = pulse ? motion.span : 'span'
  const pulseProps = pulse ? {
    animate: {
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {}

  return (
    <Component
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        glow && 'shadow-lg shadow-current/25',
        className
      )}
      {...pulseProps}
    >
      {icon}
      {children}
    </Component>
  )
}

// Specialized product badges
export const NewBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="info" 
    size="sm" 
    icon={<Sparkle weight="fill" className="w-3 h-3" />}
    pulse
    className={className}
  >
    NEW
  </EnhancedBadge>
)

export const TrendingBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="warning" 
    size="sm" 
    icon={<TrendUp weight="bold" className="w-3 h-3" />}
    pulse
    className={className}
  >
    TRENDING
  </EnhancedBadge>
)

export const HotBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="destructive" 
    size="sm" 
    icon={<Fire weight="fill" className="w-3 h-3" />}
    pulse
    glow
    className={className}
  >
    HOT
  </EnhancedBadge>
)

export const SaleBadge = ({ discount }: { discount?: number }) => (
  <EnhancedBadge 
    variant="destructive" 
    size="sm" 
    icon={<Tag weight="fill" className="w-3 h-3" />}
    glow
  >
    {discount ? `${discount}% OFF` : 'SALE'}
  </EnhancedBadge>
)

export const BestSellerBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="success" 
    size="sm" 
    icon={<Star weight="fill" className="w-3 h-3" />}
    className={className}
  >
    BESTSELLER
  </EnhancedBadge>
)

export const FlashSaleBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="warning" 
    size="sm" 
    icon={<Lightning weight="fill" className="w-3 h-3" />}
    pulse
    glow
    className={className}
  >
    FLASH SALE
  </EnhancedBadge>
)

export const VerifiedBadge = ({ className }: { className?: string }) => (
  <EnhancedBadge 
    variant="success" 
    size="sm" 
    icon={<Check weight="bold" className="w-3 h-3" />}
    className={className}
  >
    VERIFIED
  </EnhancedBadge>
)

// Discount badge with gradient
export const GradientDiscountBadge = ({ discount }: { discount: number }) => (
  <motion.div
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-orange-500 shadow-lg"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
  >
    <Tag weight="fill" className="w-3 h-3" />
    {discount}% OFF
  </motion.div>
)

// Notification count badge
export const NotificationBadge = ({ count, max = 99 }: { count: number; max?: number }) => {
  const displayCount = count > max ? `${max}+` : count

  if (count === 0) return null

  return (
    <motion.span
      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {displayCount}
    </motion.span>
  )
}

// Status badges
export const StatusBadge = ({ 
  status 
}: { 
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
}) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    processing: { variant: 'info' as const, label: 'Processing' },
    shipped: { variant: 'info' as const, label: 'Shipped' },
    delivered: { variant: 'success' as const, label: 'Delivered' },
    cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    refunded: { variant: 'secondary' as const, label: 'Refunded' },
  }

  const config = statusConfig[status]

  return (
    <EnhancedBadge variant={config.variant} size="sm">
      {config.label}
    </EnhancedBadge>
  )
}

// Stock status badge
export const StockBadge = ({ 
  inStock, 
  lowStock = false 
}: { 
  inStock: boolean
  lowStock?: boolean 
}) => {
  if (!inStock) {
    return (
      <EnhancedBadge variant="destructive" size="sm">
        Out of Stock
      </EnhancedBadge>
    )
  }

  if (lowStock) {
    return (
      <EnhancedBadge variant="warning" size="sm" pulse>
        Low Stock
      </EnhancedBadge>
    )
  }

  return (
    <EnhancedBadge variant="success" size="sm">
      In Stock
    </EnhancedBadge>
  )
}

// Rating badge
export const RatingBadge = ({ rating }: { rating: number }) => {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-sm font-semibold">
      <Star weight="fill" className="w-3 h-3" />
      {rating.toFixed(1)}
    </div>
  )
}
