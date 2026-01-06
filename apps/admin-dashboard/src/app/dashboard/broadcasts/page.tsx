'use client';

import { useState, useEffect } from 'react';
import { useBroadcasts } from '@/contexts/BroadcastContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';
import { authService } from '@/lib/auth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function BroadcastsPage() {
  const { broadcasts, isLoading, markAsRead, refreshBroadcasts } = useBroadcasts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '' });
  const user = authService.getStoredUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Mark broadcasts as read when viewing the page (only for Admin/Staff, not Super Admin)
  useEffect(() => {
    if (isSuperAdmin) return; // Super Admin doesn't need to mark as read
    
    const unreadBroadcasts = broadcasts.filter((b) => !b.isRead);
    if (unreadBroadcasts.length > 0) {
      // Mark all as read when viewing the page
      unreadBroadcasts.forEach((b) => {
        markAsRead(b.id).catch(console.error);
      });
    }
  }, [broadcasts, markAsRead, isSuperAdmin]);

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
      setFormData({ title: '', message: '' });
      setShowCreateForm(false);
      refreshBroadcasts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
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
      refreshBroadcasts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete broadcast');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Broadcasts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isSuperAdmin 
              ? 'Create and manage broadcast messages sent to all Admins'
              : 'Important messages from Super Admin'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Broadcast
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && isSuperAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create Broadcast
          </h2>
          <form onSubmit={handleCreateBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter broadcast message"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Broadcast'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', message: '' });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcasts List */}
      {broadcasts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No broadcasts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 ${
                !broadcast.isRead ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {broadcast.title}
                    </h3>
                    {!broadcast.isRead && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                    {broadcast.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {isSuperAdmin ? (
                      <>
                        <span>
                          Sent: {format(new Date(broadcast.createdAt), 'MMM d, yyyy h:mm a')} (
                          {formatDistanceToNow(new Date(broadcast.createdAt), { addSuffix: true })})
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          From: Super {broadcast.sender.firstName} {broadcast.sender.lastName} (
                          {broadcast.sender.email})
                        </span>
                        <span>•</span>
                        <span>
                          {format(new Date(broadcast.createdAt), 'MMM d, yyyy h:mm a')} (
                          {formatDistanceToNow(new Date(broadcast.createdAt), { addSuffix: true })})
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

