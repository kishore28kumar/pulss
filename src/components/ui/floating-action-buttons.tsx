/**
 * Floating Action Buttons (FAB) for cart, help, and chat
 * Provides quick access to key features
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { NotificationBadge } from './ui/enhanced-badge'
import { useKV } from '@github/spark/hooks'
import {
  ShoppingCart,
  ChatCircle,
  Question,
  X,
  WhatsappLogo,
  Phone,
  EnvelopeSimple,
  ArrowUp,
} from '@phosphor-icons/react'
import { fabAnimation, buttonHover, buttonTap } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface FloatingCartButtonProps {
  onClick?: () => void
  className?: string
}

export const FloatingCartButton = ({ onClick, className }: FloatingCartButtonProps) => {
  const [cart] = useKV<Array<{ id: string; quantity: number }>>('cart', [])
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const totalItems = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={fabAnimation}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'fixed bottom-6 right-6 z-50',
            className
          )}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center group"
          >
            <ShoppingCart className="h-6 w-6" weight="bold" />
            {totalItems > 0 && <NotificationBadge count={totalItems} />}
            
            {/* Pulse ring effect */}
            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-300" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface FloatingChatButtonProps {
  onClick?: () => void
  unreadCount?: number
  className?: string
}

export const FloatingChatButton = ({ onClick, unreadCount = 0, className }: FloatingChatButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('fixed bottom-6 left-6 z-50', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-16 left-0 mb-2 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-64"
          >
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Need Help?</h3>
              
              <button
                onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <WhatsappLogo className="h-5 w-5 text-white" weight="fill" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Chat with us</div>
                </div>
              </button>

              <button
                onClick={() => window.location.href = 'tel:1234567890'}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" weight="fill" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Call Us</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">+91 1234567890</div>
                </div>
              </button>

              <button
                onClick={() => window.location.href = 'mailto:support@pulss.app'}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <EnvelopeSimple className="h-5 w-5 text-white" weight="fill" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Email</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">support@pulss.app</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        variants={fabAnimation}
        initial="initial"
        animate="animate"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatCircle className="h-6 w-6" weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>
        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
        
        {/* Pulse ring effect */}
        <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-300" />
      </motion.button>
    </div>
  )
}

interface FloatingHelpButtonProps {
  onClick?: () => void
  className?: string
}

export const FloatingHelpButton = ({ onClick, className }: FloatingHelpButtonProps) => {
  return (
    <motion.div
      variants={fabAnimation}
      initial="initial"
      animate="animate"
      className={cn('fixed bottom-24 right-6 z-50', className)}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="relative h-12 w-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center group"
        title="Help & Support"
      >
        <Question className="h-5 w-5" weight="bold" />
        
        {/* Pulse ring effect */}
        <span className="absolute inset-0 rounded-full bg-orange-400 opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-300" />
      </motion.button>
    </motion.div>
  )
}

// Scroll to top button
export const ScrollToTopButton = ({ className }: { className?: string }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={fabAnimation}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn('fixed bottom-24 left-6 z-50', className)}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="h-12 w-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center"
            title="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" weight="bold" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Combined FAB Group
export const FloatingActionButtons = () => {
  return (
    <>
      <FloatingCartButton />
      <FloatingChatButton />
      <ScrollToTopButton />
    </>
  )
}
