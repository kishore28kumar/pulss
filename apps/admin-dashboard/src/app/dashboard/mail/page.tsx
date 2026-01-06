'use client';

import { useState, useEffect, useRef } from 'react';
import { useMail } from '@/contexts/MailContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Plus, Send, ArrowLeft, User, Mail } from 'lucide-react';
import { authService } from '@/lib/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MailPage() {
  const {
    conversations,
    currentMessages,
    currentPartner,
    isLoading,
    selectConversation,
    sendMessage: sendMailMessage,
    refreshConversations,
  } = useMail();

  const [showCompose, setShowCompose] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composeData, setComposeData] = useState({ recipientId: '', subject: '', body: '' });
  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
  const user = authService.getStoredUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available recipients (Super Admin or Admin users)
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const response = await api.get('/mail/recipients');
        const recipients = response.data.data || [];
        setAvailableRecipients(recipients);
      } catch (error) {
        console.error('Failed to load recipients:', error);
      }
    };

    if (user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role || '')) {
      loadRecipients();
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && currentMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!composeData.recipientId || !composeData.subject.trim() || !composeData.body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      await sendMailMessage(composeData.recipientId, composeData.subject, composeData.body);
      toast.success('Message sent successfully');
      setComposeData({ recipientId: '', subject: '', body: '' });
      setShowCompose(false);
      refreshConversations();
      
      // If viewing this conversation, select it to see the new message
      if (currentPartner?.id === composeData.recipientId) {
        await selectConversation(composeData.recipientId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getPartnerName = (partner: any) => {
    // Show role prefix for Super Admin
    if (partner.role === 'SUPER_ADMIN') {
      return 'Super Admin';
    }
    
    if (partner.firstName && partner.lastName) {
      return `${partner.firstName} ${partner.lastName}`;
    }
    return partner.email;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Internal messaging between Super Admin and Admin
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {showCompose ? (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCompose(false)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to conversations
              </button>
              <form onSubmit={handleCompose} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To
                  </label>
                  <select
                    value={composeData.recipientId}
                    onChange={(e) => setComposeData({ ...composeData, recipientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select recipient</option>
                    {availableRecipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {getPartnerName(recipient)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter subject"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter message"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a new conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => selectConversation(conv.partnerId)}
                      className={cn(
                        'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        currentPartner?.id === conv.partnerId && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {getPartnerName(conv.partner)}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage.subject}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Messages View */}
        <div className="flex-1 flex flex-col">
          {currentPartner ? (
            <>
              {/* Partner Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {getPartnerName(currentPartner)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentPartner.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isSent = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', isSent ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg p-4',
                            isSent
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <div className="font-semibold mb-1 text-sm">
                            {message.subject}
                          </div>
                          <p className="text-sm whitespace-pre-wrap mb-2">{message.body}</p>
                          <p
                            className={cn(
                              'text-xs',
                              isSent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const subject = formData.get('subject') as string;
                    const body = formData.get('body') as string;
                    
                    if (!subject.trim() || !body.trim()) {
                      toast.error('Subject and message are required');
                      return;
                    }

                    setIsSending(true);
                    try {
                      await sendMailMessage(currentPartner.id, subject, body);
                      e.currentTarget.reset();
                      toast.success('Message sent');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to send message');
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                  <div className="flex gap-2">
                    <textarea
                      name="body"
                      rows={2}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

