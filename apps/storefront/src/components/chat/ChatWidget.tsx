'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronUp } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const { messages, isLoading, isConnected, sendMessage, loadMoreHistory, hasMoreHistory } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Only show chat if authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Handle scroll for load more
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Show load more button when scrolled to top
    if (container.scrollTop === 0 && hasMoreHistory) {
      setShowLoadMore(true);
    } else {
      setShowLoadMore(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !isConnected) return;

    setIsSending(true);
    try {
      sendMessage(inputText.trim());
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

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center group"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {!isConnected && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 md:h-[600px] z-50 flex flex-col bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-2xl md:rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Chat Support</h3>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              ) : (
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded transition"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {showLoadMore && hasMoreHistory && (
              <div className="text-center">
                <button
                  onClick={loadMoreHistory}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center space-x-1 mx-auto"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Load older messages</span>
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No messages yet. Start a conversation!</p>
                {!isConnected && (
                  <p className="text-sm text-red-500 mt-2">Connecting...</p>
                )}
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
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isCustomer
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {!isCustomer && (
                        <p className="text-xs font-semibold mb-1 opacity-80">
                          {displayName}
                        </p>
                      )}
                      {isCustomer && (
                        <p className="text-xs font-semibold mb-1 text-blue-100">
                          {displayName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isCustomer ? 'text-blue-100' : 'text-gray-500'
                        }`}
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
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl md:rounded-b-2xl">
            {!isConnected && (
              <p className="text-xs text-red-500 mb-2 text-center">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isSending || !isConnected}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

