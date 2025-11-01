/**
 * Dashboard Statistics Cards
 * Animated statistics cards for dashboards
 */

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'
import { scaleIn, fadeInUp } from '@/lib/animations'
import {
  TrendUp,
  TrendDown,
  ArrowUp,
  ArrowDown,
  Circle,
} from '@phosphor-icons/react'

interface StatCard {
  id: string
  label: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink'
  prefix?: string
  suffix?: string
  format?: 'number' | 'currency' | 'percentage'
}

interface StatsGridProps {
  stats: StatCard[]
  columns?: 2 | 3 | 4
  loading?: boolean
  className?: string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-red-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-500 to-pink-500',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
  },
}

export const StatsGrid = ({ stats, columns = 4, loading = false, className }: StatsGridProps) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ delay: index * 0.1 }}
        >
          <StatisticCard stat={stat} loading={loading} />
        </motion.div>
      ))}
    </div>
  )
}

// Individual Stat Card
const StatisticCard = ({ stat, loading }: { stat: StatCard; loading?: boolean }) => {
  const color = stat.color || 'blue'
  const colors = colorClasses[color]

  const formatValue = (value: number | string) => {
    if (typeof value === 'string') return value

    switch (stat.format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(value)
      case 'percentage':
        return `${value}%`
      case 'number':
      default:
        return new Intl.NumberFormat('en-IN').format(value)
    }
  }

  const getChangeIcon = () => {
    if (!stat.change) return null
    if (stat.changeType === 'increase') {
      return <TrendUp className="w-4 h-4" weight="bold" />
    }
    if (stat.changeType === 'decrease') {
      return <TrendDown className="w-4 h-4" weight="bold" />
    }
    return <Circle className="w-4 h-4" weight="fill" />
  }

  const getChangeColor = () => {
    if (!stat.change) return ''
    if (stat.changeType === 'increase') {
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    }
    if (stat.changeType === 'decrease') {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    }
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Gradient Background */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20',
          `bg-gradient-to-br ${colors.gradient}`
        )}
      />

      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            {stat.icon && <div className={colors.text}>{stat.icon}</div>}
          </div>

          {stat.change !== undefined && (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getChangeColor())}>
              {getChangeIcon()}
              <span>{Math.abs(stat.change)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
          <div className="flex items-baseline gap-1">
            {stat.prefix && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.prefix}</span>
            )}
            <AnimatedNumber
              value={typeof stat.value === 'number' ? stat.value : 0}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {typeof stat.value === 'string' ? stat.value : formatValue(stat.value)}
            </AnimatedNumber>
            {stat.suffix && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.suffix}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Animated Number Counter
const AnimatedNumber = ({
  value,
  className,
  children,
}: {
  value: number
  className?: string
  children?: React.ReactNode
}) => {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: 2000 })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (children) {
        setDisplayValue(children.toString())
      } else {
        setDisplayValue(Math.round(latest).toLocaleString())
      }
    })

    return unsubscribe
  }, [springValue, children])

  return <span className={className}>{displayValue}</span>
}

// Compact Stat Card (for smaller spaces)
export const CompactStatCard = ({ stat }: { stat: StatCard }) => {
  const color = stat.color || 'blue'
  const colors = colorClasses[color]

  return (
    <motion.div
      variants={fadeInUp}
      className={cn('p-4 rounded-lg', colors.bg)}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
          <p className={cn('text-2xl font-bold', colors.text)}>
            {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
          </p>
        </div>
        {stat.icon && <div className={cn('text-3xl', colors.text)}>{stat.icon}</div>}
      </div>
      {stat.change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {stat.changeType === 'increase' ? (
            <ArrowUp className="w-3 h-3 text-green-600" weight="bold" />
          ) : (
            <ArrowDown className="w-3 h-3 text-red-600" weight="bold" />
          )}
          <span
            className={
              stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }
          >
            {Math.abs(stat.change)}% from last period
          </span>
        </div>
      )}
    </motion.div>
  )
}

// Welcome Banner
interface WelcomeBannerProps {
  userName?: string
  greeting?: string
  message?: string
  actions?: React.ReactNode
  className?: string
}

export const WelcomeBanner = ({
  userName,
  greeting,
  message,
  actions,
  className,
}: WelcomeBannerProps) => {
  const getGreeting = () => {
    if (greeting) return greeting

    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white',
        className
      )}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}{userName && `, ${userName}`}! 👋
          </h1>
          {message && <p className="text-lg text-white/90 mb-6">{message}</p>}
        </motion.div>

        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Progress Ring for stats
export const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 12,
  color = 'blue',
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: keyof typeof colorClasses
}) => {
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const colors = colorClasses[color]

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="fill-none stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          className={cn('fill-none', colors.text)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-2xl font-bold', colors.text)}>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
