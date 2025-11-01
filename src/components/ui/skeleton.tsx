/**
 * Enhanced Skeleton loader components for loading states
 * Provides smooth loading experience while data is being fetched
 */

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { ComponentProps } from "react"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white dark:bg-gray-800 shadow-sm">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="w-1/4 h-6" />
        <Skeleton className="w-20 h-8 rounded-full" />
      </div>
    </div>
  )
}

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// List Item Skeleton
export const ListItemSkeleton = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </div>
    </div>
  )
}

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-10" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800 shadow-sm">
      <Skeleton className="w-1/2 h-6" />
      <div className="space-y-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
      </div>
    </div>
  )
}

// Dashboard Widget Skeleton
export const DashboardWidgetSkeleton = () => {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <Skeleton className="w-1/2 h-8" />
      <Skeleton className="w-full h-4" />
    </div>
  )
}

// Chart Skeleton
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => {
  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
      <Skeleton className="w-1/3 h-6 mb-4" />
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  )
}

// Form Field Skeleton
export const FormFieldSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-full h-10 rounded-lg" />
    </div>
  )
}

// Review Skeleton
export const ReviewSkeleton = () => {
  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex items-start space-x-4">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
        </div>
      </div>
    </div>
  )
}

// Category Card Skeleton
export const CategoryCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 text-center shadow-sm">
      <Skeleton className="w-16 h-16 rounded-full mx-auto" />
      <Skeleton className="w-3/4 h-4 mx-auto" />
    </div>
  )
}

// Order Item Skeleton
export const OrderItemSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton }
