/**
 * Empty state components with illustrations
 * Provides friendly empty state messages for better UX
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { fadeInUp, scaleIn } from '@/lib/animations'
import {
  ShoppingCart,
  MagnifyingGlass,
  Package,
  Heart,
  FileText,
  Database,
  Warning,
  CloudSlash,
  UsersThree,
  Receipt,
  ChatCircle,
  Bell,
  Star,
  ListChecks,
  ArrowRight,
} from '@phosphor-icons/react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: 'cart' | 'search' | 'orders' | 'wishlist' | 'products' | 'data' | 'error' | 'offline' | 'users' | 'reviews' | 'chat' | 'notifications'
}

const illustrations = {
  cart: ShoppingCart,
  search: MagnifyingGlass,
  orders: Receipt,
  wishlist: Heart,
  products: Package,
  data: Database,
  error: Warning,
  offline: CloudSlash,
  users: UsersThree,
  reviews: Star,
  chat: ChatCircle,
  notifications: Bell,
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  illustration = 'data'
}: EmptyStateProps) => {
  const Icon = illustrations[illustration]

  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={scaleIn}
        className="mb-6"
      >
        {icon || (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </motion.div>
      
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} size="lg" className="group">
          {action.label}
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
    </motion.div>
  )
}

// Specific empty states
export const EmptyCart = ({ onStartShopping }: { onStartShopping?: () => void }) => (
  <EmptyState
    illustration="cart"
    title="Your cart is empty"
    description="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
    action={onStartShopping ? {
      label: 'Start Shopping',
      onClick: onStartShopping
    } : undefined}
  />
)

export const EmptySearch = ({ query }: { query?: string }) => (
  <EmptyState
    illustration="search"
    title={query ? `No results for "${query}"` : "No results found"}
    description="Try adjusting your search or filters to find what you're looking for."
  />
)

export const EmptyOrders = () => (
  <EmptyState
    illustration="orders"
    title="No orders yet"
    description="You haven't placed any orders. When you do, they'll appear here."
  />
)

export const EmptyWishlist = ({ onBrowse }: { onBrowse?: () => void }) => (
  <EmptyState
    illustration="wishlist"
    title="Your wishlist is empty"
    description="Save items you love for later by adding them to your wishlist."
    action={onBrowse ? {
      label: 'Browse Products',
      onClick: onBrowse
    } : undefined}
  />
)

export const EmptyProducts = ({ onAddProduct }: { onAddProduct?: () => void }) => (
  <EmptyState
    illustration="products"
    title="No products available"
    description="Get started by adding your first product to the catalog."
    action={onAddProduct ? {
      label: 'Add Product',
      onClick: onAddProduct
    } : undefined}
  />
)

export const EmptyReviews = () => (
  <EmptyState
    illustration="reviews"
    title="No reviews yet"
    description="Be the first to review this product and help others make informed decisions."
  />
)

export const EmptyNotifications = () => (
  <EmptyState
    illustration="notifications"
    title="No notifications"
    description="You're all caught up! New notifications will appear here."
  />
)

export const EmptyChat = () => (
  <EmptyState
    illustration="chat"
    title="No messages"
    description="Start a conversation to get help from our support team."
  />
)

export const ErrorState = ({ 
  onRetry, 
  message = "Something went wrong"
}: { 
  onRetry?: () => void
  message?: string 
}) => (
  <EmptyState
    illustration="error"
    title="Oops! Something went wrong"
    description={message}
    action={onRetry ? {
      label: 'Try Again',
      onClick: onRetry
    } : undefined}
  />
)

export const OfflineState = () => (
  <EmptyState
    illustration="offline"
    title="You're offline"
    description="Please check your internet connection and try again."
  />
)

// Animated illustration components
export const AnimatedEmptyCart = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <div className="relative">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ShoppingCart className="w-16 h-16 text-blue-500" weight="duotone" />
          </motion.div>
          
          {/* Floating sparkles */}
          <motion.div
            className="absolute top-0 right-0 w-6 h-6 rounded-full bg-yellow-400"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-pink-400"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
          />
        </div>
      </motion.div>
      
      <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Your cart is empty
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md text-center mb-6">
        Looks like you haven't added anything yet. Start shopping to fill it up!
      </p>
    </motion.div>
  )
}

export const AnimatedEmptySearch = ({ query }: { query?: string }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center">
          <MagnifyingGlass className="w-16 h-16 text-orange-500" weight="duotone" />
        </div>
      </motion.div>
      
      <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {query ? `No results for "${query}"` : "No results found"}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md text-center">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </motion.div>
  )
}
