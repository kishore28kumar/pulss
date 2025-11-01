/**
 * Product Ratings and Reviews Component
 * Displays ratings, reviews, and review submission form
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from './card'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Progress } from './progress'
import { Star, ThumbsUp, ThumbsDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'
import { ReviewSkeleton } from './skeleton'
import { toast } from 'sonner'

interface Review {
  id: string
  user_name: string
  user_avatar?: string
  rating: number
  title?: string
  comment: string
  created_at: string
  verified_purchase?: boolean
  helpful_count?: number
  images?: string[]
}

interface RatingsSummary {
  average: number
  total_reviews: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface ProductRatingsProps {
  productId: string
  summary: RatingsSummary
  reviews: Review[]
  loading?: boolean
  onSubmitReview?: (review: { rating: number; title: string; comment: string }) => void
  onHelpful?: (reviewId: string) => void
  className?: string
}

export const ProductRatings = ({
  productId,
  summary,
  reviews,
  loading = false,
  onSubmitReview,
  onHelpful,
  className,
}: ProductRatingsProps) => {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)

  const handleSubmitReview = () => {
    if (newRating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a review')
      return
    }

    onSubmitReview?.({
      rating: newRating,
      title: reviewTitle,
      comment: reviewComment,
    })

    // Reset form
    setNewRating(0)
    setReviewTitle('')
    setReviewComment('')
    setShowReviewForm(false)
    toast.success('Review submitted successfully!')
  }

  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews

  const getRatingPercentage = (rating: number) => {
    return summary.total_reviews > 0
      ? (summary.distribution[rating as keyof typeof summary.distribution] / summary.total_reviews) * 100
      : 0
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Ratings Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="text-6xl font-bold text-gray-900 dark:text-white">
                  {summary.average.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        weight={star <= Math.round(summary.average) ? 'fill' : 'regular'}
                        className={cn(
                          'w-6 h-6',
                          star <= Math.round(summary.average) ? 'text-amber-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on {summary.total_reviews} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={cn(
                    'w-full flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors',
                    filterRating === rating && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star weight="fill" className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <Progress value={getRatingPercentage(rating)} className="h-2" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                    {summary.distribution[rating as keyof typeof summary.distribution]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full md:w-auto"
            >
              Write a Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Write Your Review</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <motion.button
                        key={rating}
                        onClick={() => setNewRating(rating)}
                        onMouseEnter={() => setHoveredRating(rating)}
                        onMouseLeave={() => setHoveredRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star
                          weight={rating <= (hoveredRating || newRating) ? 'fill' : 'regular'}
                          className={cn(
                            'w-8 h-8',
                            rating <= (hoveredRating || newRating)
                              ? 'text-amber-400'
                              : 'text-gray-300'
                          )}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Review Title</label>
                  <Input
                    placeholder="Sum up your experience in a few words"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-sm font-medium mb-2">Your Review *</label>
                  <Textarea
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={handleSubmitReview}>Submit Review</Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            Customer Reviews {filterRating && `(${filterRating} stars)`}
          </h3>
          {filterRating && (
            <Button variant="ghost" size="sm" onClick={() => setFilterRating(null)}>
              Clear Filter
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {filterRating
                  ? `No ${filterRating}-star reviews yet`
                  : 'No reviews yet. Be the first to review this product!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {filteredReviews.map((review) => (
              <motion.div key={review.id} variants={staggerItem}>
                <ReviewCard review={review} onHelpful={onHelpful} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Individual Review Card
const ReviewCard = ({
  review,
  onHelpful,
}: {
  review: Review
  onHelpful?: (reviewId: string) => void
}) => {
  const [hasVoted, setHasVoted] = useState(false)

  const handleHelpful = () => {
    if (!hasVoted) {
      onHelpful?.(review.id)
      setHasVoted(true)
      toast.success('Thanks for your feedback!')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-12 h-12">
            <AvatarImage src={review.user_avatar} alt={review.user_name} />
            <AvatarFallback>{review.user_name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {review.user_name}
                  </span>
                  {review.verified_purchase && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                      <Check weight="bold" className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        weight={star <= review.rating ? 'fill' : 'regular'}
                        className={cn(
                          'w-4 h-4',
                          star <= review.rating ? 'text-amber-400' : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                {review.title}
              </h4>
            )}

            {/* Review Comment */}
            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
              {review.comment}
            </p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-4">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Helpful Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleHelpful}
                disabled={hasVoted}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  hasVoted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <ThumbsUp
                  weight={hasVoted ? 'fill' : 'regular'}
                  className="w-4 h-4"
                />
                Helpful {review.helpful_count ? `(${review.helpful_count})` : ''}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact rating display for product cards
export const CompactRating = ({
  rating,
  reviewCount,
  showCount = true,
}: {
  rating: number
  reviewCount?: number
  showCount?: boolean
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            weight={star <= Math.round(rating) ? 'fill' : 'regular'}
            className={cn(
              'w-3.5 h-3.5',
              star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
