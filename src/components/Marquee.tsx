import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Info, Warning, CheckCircle } from '@phosphor-icons/react'

interface MarqueeItem {
  text: string
  type: 'info' | 'warning' | 'success'
}

interface MarqueeProps {
  items: MarqueeItem[]
  className?: string
}

const getMarqueeColors = (type: 'info' | 'warning' | 'success') => {
  switch (type) {
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800'
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800'
  }
}

const getMarqueeIcon = (type: 'info' | 'warning' | 'success') => {
  switch (type) {
    case 'info':
      return <Info className="h-4 w-4" />
    case 'warning':
      return <Warning className="h-4 w-4" />
    case 'success':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

export const Marquee = ({ items, className = '' }: MarqueeProps) => {
  if (!items.length) return null

  return (
    <div className={`overflow-hidden ${className}`}>
      {items.map((item, index) => (
        <Alert key={index} className={`mb-2 ${getMarqueeColors(item.type)}`}>
          <div className="flex items-center">
            {getMarqueeIcon(item.type)}
            <AlertDescription className="ml-2 font-medium">
              {item.text}
            </AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  )
}

// Alternative scrolling marquee for messages
interface ScrollingMarqueeProps {
  messages: string[]
  speed?: number
  className?: string
}

export const ScrollingMarquee = ({ 
  messages, 
  speed = 50,
  className = '' 
}: ScrollingMarqueeProps) => {
  if (!messages.length) return null

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div 
        className="inline-block animate-marquee"
        style={{
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite'
        }}
      >
        {messages.map((message, index) => (
          <span key={index} className="mx-8 font-medium">
            🔔 {message}
          </span>
        ))}
      </div>
    </div>
  )
}