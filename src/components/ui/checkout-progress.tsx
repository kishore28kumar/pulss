/**
 * Checkout Progress Indicator
 * Multi-step checkout flow with progress visualization
 */

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check } from '@phosphor-icons/react'

interface CheckoutStep {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface CheckoutProgressProps {
  steps: CheckoutStep[]
  currentStep: number
  className?: string
}

export const CheckoutProgress = ({ steps, currentStep, className }: CheckoutProgressProps) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ width: '0%' }}
              animate={{
                width: `${((currentStep) / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const isPending = index > currentStep

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <motion.div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      isCompleted &&
                        'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent',
                      isCurrent &&
                        'bg-white dark:bg-gray-900 border-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30',
                      isPending && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <Check className="w-5 h-5 text-white" weight="bold" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <div className="mt-3 text-center max-w-[120px]">
                    <div
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isCurrent && 'text-blue-600 dark:text-blue-400',
                        isCompleted && 'text-gray-900 dark:text-white',
                        isPending && 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ width: '0%' }}
                animate={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
            <span className="text-white font-bold">{currentStep + 1}</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {steps[currentStep].label}
            </div>
            {steps[currentStep].description && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {steps[currentStep].description}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Compact progress bar variant
export const CompactCheckoutProgress = ({
  steps,
  currentStep,
  className,
}: CheckoutProgressProps) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {steps[currentStep].label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentStep + 1}/{steps.length}
        </span>
      </div>
      <div className="flex gap-1">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index <= currentStep
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-gray-200 dark:bg-gray-700'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>
    </div>
  )
}

// Vertical progress indicator
export const VerticalCheckoutProgress = ({
  steps,
  currentStep,
  className,
}: CheckoutProgressProps) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="w-full bg-gradient-to-b from-blue-600 to-purple-600"
            initial={{ height: '0%' }}
            animate={{
              height: `${((currentStep) / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Steps */}
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isPending = index > currentStep

            return (
              <div key={step.id} className="flex items-start gap-4">
                {/* Step Circle */}
                <motion.div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0',
                    isCompleted &&
                      'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent',
                    isCurrent &&
                      'bg-white dark:bg-gray-900 border-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30',
                    isPending && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" weight="bold" />
                  ) : isCurrent ? (
                    <motion.div
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                  )}
                </motion.div>

                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <div
                    className={cn(
                      'font-medium transition-colors',
                      isCurrent && 'text-blue-600 dark:text-blue-400',
                      isCompleted && 'text-gray-900 dark:text-white',
                      isPending && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
