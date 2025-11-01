import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ChatCircleDots, PaperPlaneTilt } from '@phosphor-icons/react'

interface FeedbackData {
  category: string
  subject: string
  message: string
  email?: string
}

export const FeedbackWidget: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData>({
    category: 'General',
    subject: '',
    message: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['Bug Report', 'Feature Request', 'Improvement', 'General']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.subject || !feedback.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would send to your backend or webhook
      // For now, we'll just log and show success
      console.log('Feedback submitted:', feedback)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success('Thank you for your feedback!')
      setOpen(false)
      setFeedback({
        category: 'General',
        subject: '',
        message: '',
        email: ''
      })
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          title="Send Feedback"
        >
          <ChatCircleDots size={24} weight="fill" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear from you! Share your thoughts, report bugs, or suggest new features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="w-full px-3 py-2 border rounded-md"
              value={feedback.category}
              onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your feedback"
              value={feedback.subject}
              onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your feedback..."
              className="min-h-[120px]"
              value={feedback.message}
              onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={feedback.email}
              onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              We'll only use this to respond to your feedback
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <PaperPlaneTilt className="mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
