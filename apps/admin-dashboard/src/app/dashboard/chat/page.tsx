'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, User } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isConnected,
    selectConversation,
    sendMessage,
    markAsRead,
  } = useChat();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (currentConversation) {
      markAsRead(currentConversation.customerId);
    }
  }, [currentConversation, markAsRead]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !isConnected || !currentConversation) return;

    setIsSending(true);
    try {
      sendMessage(inputText.trim(), currentConversation.customerId);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const customerName = (conv: typeof conversations[0]) => {
    if (conv.customer.firstName && conv.customer.lastName) {
      return `${conv.customer.firstName} ${conv.customer.lastName}`;
    }
    return conv.customer.email;
  };

  // Get user role for display
  const getUserRole = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Chat</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Manage customer conversations
        </p>
      </div>

      {/* Chat Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-200px)]">
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Conversations</h2>
                {!isConnected && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conv) => (
                    <button
                      key={conv.customerId}
                      onClick={() => selectConversation(conv.customerId)}
                      className={cn(
                        'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition',
                        currentConversation?.customerId === conv.customerId &&
                          'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.customer.avatar ? (
                            <img
                              src={conv.customer.avatar}
                              alt={customerName(conv)}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {customerName(conv)}
                          </p>
                          {userRole === 'SUPER_ADMIN' && conv.tenantSlug && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              Tenant: {conv.tenantSlug}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conv.lastMessage.text}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDate(conv.lastMessage.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      {currentConversation.customer.avatar ? (
                        <img
                          src={currentConversation.customer.avatar}
                          alt={customerName(currentConversation)}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {customerName(currentConversation)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentConversation.customer.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCustomer = message.senderType === 'customer';
                      const senderName =
                        message.sender.firstName && message.sender.lastName
                          ? `${message.sender.firstName} ${message.sender.lastName}`
                          : message.sender.email;

                      // Determine sender display name
                      let displayName = senderName;
                      if (message.senderType === 'super_admin') {
                        displayName = 'Super Admin';
                      } else if (message.senderType === 'admin') {
                        displayName = 'Admin';
                      } else if (message.senderType === 'staff') {
                        displayName = 'Staff';
                      }

                      return (
                        <div
                          key={message.id}
                          className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg p-3',
                              isCustomer
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                : 'bg-blue-600 text-white'
                            )}
                          >
                            {!isCustomer && (
                              <p className="text-xs font-semibold mb-1 opacity-80">
                                {displayName}
                              </p>
                            )}
                            {isCustomer && (
                              <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">
                                {displayName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            <p
                              className={cn(
                                'text-xs mt-1',
                                isCustomer
                                  ? 'text-gray-500 dark:text-gray-400'
                                  : 'text-blue-100'
                              )}
                            >
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  {!isConnected && (
                    <p className="text-xs text-red-500 dark:text-red-400 mb-2 text-center">
                      Offline - Messages will be sent when reconnected
                    </p>
                  )}
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={!isConnected || isSending}
                      rows={2}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || isSending || !isConnected}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

