'use client';

import { useState, useEffect } from 'react';
import { useBroadcasts } from '@/contexts/BroadcastContext';
import { format } from 'date-fns';
import { Trash2, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { authService } from '@/lib/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function BroadcastsPage() {
  const { broadcasts: receivedBroadcasts, isLoading: isContextLoading, markAsRead, refreshBroadcasts } = useBroadcasts();
  const { checkAccess, isSubscriptionActive } = useSubscription();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [sentBroadcasts, setSentBroadcasts] = useState<any[]>([]);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', imageUrl: '', link: '' });
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(authService.getStoredUser());
    setMounted(true);
  }, []);
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  // Only show button if mounted and user has permission
  const canSendBroadcast = mounted && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user?.role || '');

  // Load sent broadcasts when tab changes
  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentBroadcasts();
    }
  }, [activeTab]);

  const fetchSentBroadcasts = async () => {
    setIsLoadingSent(true);
    try {
      const response = await api.get('/broadcasts?type=sent');
      setSentBroadcasts(response.data.data);
    } catch {
      toast.error('Failed to load sent broadcasts');
    } finally {
      setIsLoadingSent(false);
    }
  };

  // Mark broadcasts as read when viewing the page (only for Received tab)
  useEffect(() => {
    if (isSuperAdmin || activeTab === 'sent') return;
    
    const unreadBroadcasts = receivedBroadcasts.filter((b) => !b.isRead);
    if (unreadBroadcasts.length > 0) {
      // Mark all as read when viewing the page
      unreadBroadcasts.forEach((b) => {
        markAsRead(b.id).catch(console.error);
      });
    }
  }, [receivedBroadcasts, markAsRead, isSuperAdmin, activeTab]);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/broadcasts', formData);
      toast.success('Broadcast sent successfully');
      setFormData({ title: '', message: '', imageUrl: '', link: '' });
      setShowCreateForm(false);
      
      // Refresh proper list
      if (activeTab === 'sent') {
        fetchSentBroadcasts();
      } else {
        // If we serve received broadcasts via context and we (admin) send to customers,
        // it won't appear in received. So just flip to sent tab?
        setActiveTab('sent');
      }
      
      // If Super Admin, they might see it in received too (via socket echo), but context handles that.
      if (isSuperAdmin) {
        refreshBroadcasts();
      }
    } catch (error: any) {
      // toast.error(error.response?.data?.message || 'Failed to send broadcast');
      console.error(error);
      toast.error('Failed to send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBroadcast = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }

    try {
      await api.delete(`/broadcasts/${broadcastId}`);
      toast.success('Broadcast deleted successfully');
      refreshBroadcasts(); // For context
      if (activeTab === 'sent') fetchSentBroadcasts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete broadcast');
    }
  };

  const displayedBroadcasts = activeTab === 'received' ? receivedBroadcasts : sentBroadcasts;
  const isLoading = activeTab === 'received' ? isContextLoading : isLoadingSent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Broadcasts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === 'received' 
              ? 'Messages received from Customer Support' 
              : 'Messages sent to your customers'}
          </p>
        </div>
        {canSendBroadcast && (
          <button
            onClick={() => {
              if (checkAccess('broadcast')) {
                setShowCreateForm(!showCreateForm);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${!isSubscriptionActive ? 'opacity-75' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Broadcast</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'received'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'sent'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            Sent
          </button>
        </nav>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Send New Broadcast
                </h2>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateBroadcast} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter broadcast title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter broadcast message"
                    required
                  />
                </div>
                
                {/* Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Link URL (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/promo"
                    />
                    <ExternalLink className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Broadcasts List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : displayedBroadcasts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'received' ? 'No messages received' : 'No messages sent yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBroadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 ${
                activeTab === 'received' && !broadcast.isRead ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {broadcast.title}
                    </h3>
                    {activeTab === 'received' && !broadcast.isRead && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        New
                      </span>
                    )}
                    {broadcast.targetAudience === 'CUSTOMER' && (
                       <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        Customer Broadcast
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {broadcast.message}
                  </p>

                  {/* Image Preview */}
                  {broadcast.imageUrl && (
                     <div className="mt-3 max-w-md bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Use simple img for now, in real app use Next.js Image */}
                        <img 
                          src={broadcast.imageUrl} 
                          alt="Broadcast attachment" 
                          className="w-full h-auto object-cover max-h-64" 
                          loading="lazy"
                        />
                     </div>
                  )}

                  {/* Link Preview / Action */}
                  {broadcast.link && (
                    <div className="mt-2">
                      <a 
                        href={broadcast.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        style={{ cursor: 'pointer' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {broadcast.link}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2">
                    {isSuperAdmin || activeTab === 'sent' ? (
                      <>
                        <span>
                          Sent: {format(new Date(broadcast.createdAt), 'MMM d, yyyy h:mm a')} 
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          From: {broadcast.sender.firstName} {broadcast.sender.lastName}
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(broadcast.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </>
                    )}
                    
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteBroadcast(broadcast.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete broadcast"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
