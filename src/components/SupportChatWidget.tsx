import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Mail,
  Clock,
  User,
  Bot,
  Paperclip,
  Star,
  ThumbsUp,
  ThumbsDown
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { SupportTicket, SupportMessage, FeatureFlags } from '@/types'
import { toast } from 'sonner'

interface SupportChatWidgetProps {
  tenantId: string
  customerId?: string
  orderId?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

interface ChatMessage {
  id: string
  type: 'customer' | 'admin' | 'system' | 'bot'
  message: string
  timestamp: string
  sender_name?: string
  attachments?: string[]
  is_internal?: boolean
}

const QUICK_RESPONSES = [
  "Hi, I need help with my order",
  "Where is my order?",
  "I want to cancel my order",
  "I have a question about a product",
  "I need help with payment",
  "Technical support"
]

const FAQ_ITEMS = [
  {
    question: "How can I track my order?",
    answer: "You can track your order by going to 'My Orders' section in your account or using the order tracking link sent to your email."
  },
  {
    question: "What are the delivery charges?",
    answer: "Delivery charges vary based on location and order value. Orders above ₹500 usually qualify for free delivery."
  },
  {
    question: "Can I cancel my order?",
    answer: "You can cancel your order within 30 minutes of placing it. After that, please contact our support team."
  },
  {
    question: "Do you accept insurance?",
    answer: "We accept most major insurance plans. Please check with our pharmacist for specific coverage details."
  }
]

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({
  tenantId,
  customerId,
  orderId,
  position = 'bottom-right'
}) => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showQuickResponses, setShowQuickResponses] = useState(true)
  const [showFAQ, setShowFAQ] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFeatureFlags()
  }, [tenantId])

  useEffect(() => {
    if (featureFlags?.chat_support_enabled && isOpen && customerId) {
      loadOrCreateTicket()
    }
  }, [featureFlags, isOpen, customerId])

  useEffect(() => {
    if (currentTicket) {
      loadMessages()
      // Set up real-time message subscription
      const subscription = supabase
        .channel(`support_messages_${currentTicket.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages',
            filter: `ticket_id=eq.${currentTicket.id}`
          }, 
          (payload) => {
            const newMsg = payload.new as SupportMessage
            if (newMsg.sender_type !== 'customer') {
              setMessages(prev => [...prev, {
                id: newMsg.id,
                type: newMsg.sender_type as 'admin' | 'system',
                message: newMsg.message,
                timestamp: newMsg.created_at,
                sender_name: 'Support Team',
                attachments: newMsg.attachments || []
              }])
              
              if (!isOpen) {
                setUnreadCount(prev => prev + 1)
              }
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [currentTicket, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadOrCreateTicket = async () => {
    try {
      // Try to find existing open ticket
      let { data: existingTicket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!existingTicket) {
        // Create new ticket
        const ticketNumber = `SUP-${Date.now().toString().slice(-8)}`
        const { data: newTicket, error } = await supabase
          .from('support_tickets')
          .insert({
            tenant_id: tenantId,
            customer_id: customerId,
            order_id: orderId || null,
            ticket_number: ticketNumber,
            subject: orderId ? `Order Support - ${orderId}` : 'General Inquiry',
            description: 'Customer initiated chat support',
            status: 'open',
            priority: 'medium'
          })
          .select()
          .single()

        if (error) throw error
        existingTicket = newTicket
      }

      setCurrentTicket(existingTicket)
    } catch (error) {
      console.error('Error loading/creating ticket:', error)
      toast.error('Failed to initialize chat support')
    }
  }

  const loadMessages = async () => {
    if (!currentTicket) return

    try {
      const { data: messagesData } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', currentTicket.id)
        .eq('is_internal', false)
        .order('created_at', { ascending: true })

      const chatMessages: ChatMessage[] = messagesData?.map(msg => ({
        id: msg.id,
        type: msg.sender_type as 'customer' | 'admin' | 'system',
        message: msg.message,
        timestamp: msg.created_at,
        sender_name: msg.sender_type === 'customer' ? 'You' : 'Support Team',
        attachments: msg.attachments || []
      })) || []

      setMessages(chatMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (message: string) => {
    if (!currentTicket || !message.trim()) return

    try {
      // Add message to UI immediately
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        type: 'customer',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        sender_name: 'You'
      }
      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      setShowQuickResponses(false)
      setShowFAQ(false)

      // Send to database
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: currentTicket.id,
          sender_type: 'customer',
          message: message.trim(),
          is_internal: false
        })

      if (error) throw error

      // Simulate auto-response or bot response
      setTimeout(() => {
        if (message.toLowerCase().includes('order') && orderId) {
          simulateBotResponse(`I can see you're asking about order ${orderId}. Let me get the details for you. A support agent will be with you shortly.`)
        } else if (message.toLowerCase().includes('track')) {
          simulateBotResponse("You can track your order from the 'My Orders' section. Would you like me to help you find your order status?")
        } else {
          simulateBotResponse("Thank you for your message. A support agent will respond shortly. Our typical response time is under 5 minutes during business hours.")
        }
      }, 1000)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    }
  }

  const simulateBotResponse = (response: string) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: 'bot',
        message: response,
        timestamp: new Date().toISOString(),
        sender_name: 'Support Bot'
      }])
    }, 1500)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleQuickResponse = (response: string) => {
    setNewMessage(response)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  if (!featureFlags?.chat_support_enabled) {
    return null
  }

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`fixed ${getPositionClasses()} z-50`}
        >
          <Button
            onClick={() => {
              setIsOpen(true)
              setUnreadCount(0)
            }}
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 relative"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed ${getPositionClasses()} z-50 w-80 h-96 ${isMinimized ? 'h-12' : ''}`}
          >
            <Card className="h-full shadow-xl border-0 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold text-sm">Support Chat</h3>
                    <p className="text-xs opacity-75">We're here to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0 text-primary-foreground hover:bg-white/20"
                  >
                    {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 text-primary-foreground hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <div className="flex flex-col h-full">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-4">
                      {/* Welcome Message */}
                      {messages.length === 0 && (
                        <div className="text-center py-4">
                          <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Hi! I'm here to help. What can I assist you with today?
                          </p>
                        </div>
                      )}

                      {/* FAQ Section */}
                      {showFAQ && messages.length === 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Frequently Asked</p>
                          {FAQ_ITEMS.slice(0, 2).map((faq, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuickResponse(faq.question)}
                              className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                            >
                              {faq.question}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Responses */}
                      {showQuickResponses && messages.length === 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Quick Options</p>
                          <div className="grid grid-cols-2 gap-2">
                            {QUICK_RESPONSES.slice(0, 4).map((response, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuickResponse(response)}
                                className="p-2 text-xs bg-primary/10 hover:bg-primary/20 rounded text-primary border border-primary/20"
                              >
                                {response}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-2 ${
                              message.type === 'customer'
                                ? 'bg-primary text-primary-foreground'
                                : message.type === 'bot'
                                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-75">
                                {message.sender_name}
                              </span>
                              <span className="text-xs opacity-75">
                                {format(new Date(message.timestamp), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-2 flex items-center gap-1">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">Support is typing...</span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage(newMessage)
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMessage(newMessage)}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Additional Actions */}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Usually replies in minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SupportChatWidget