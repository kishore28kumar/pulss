import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDemoNotifications, addRandomNotification, DemoNotification } from '@/lib/demoData'
import { 
  Bell, 
  BellRinging, 
  X, 
  ShoppingCart, 
  Package, 
  Users, 
  Gear,
  Check,
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
  Plus
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// Simple date formatting function to avoid external dependency
const formatDistanceToNow = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
}

interface NotificationItemProps {
  notification: DemoNotification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkRead, 
  onDelete 
}) => {
  const getNotificationIcon = (type: DemoNotification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-blue-600" />
      case 'stock':
        return <Package className="w-4 h-4 text-orange-600" />
      case 'customer':
        return <Users className="w-4 h-4 text-green-600" />
      case 'system':
        return <Gear className="w-4 h-4 text-purple-600" />
    }
  }

  const getPriorityColor = (priority: DemoNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-200'
      case 'medium':
        return 'bg-yellow-100 border-yellow-200'
      case 'low':
        return 'bg-green-100 border-green-200'
    }
  }

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        notification.isRead ? 'opacity-70' : getPriorityColor(notification.priority)
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.timestamp)}
                </span>
                <Badge 
                  variant={notification.priority === 'high' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {notification.priority}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkRead(notification.id)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useDemoNotifications()
  const [filter, setFilter] = useState<'all' | DemoNotification['type']>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | DemoNotification['priority']>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all' && notification.type !== filter) return false
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false
    if (showUnreadOnly && notification.isRead) return false
    return true
  })

  const handleMarkRead = (id: string) => {
    setNotifications((prev = []) => 
      prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      )
    )
    toast.success('Notification marked as read')
  }

  const handleDelete = (id: string) => {
    setNotifications((prev = []) => prev.filter(n => n.id !== id))
    toast.success('Notification deleted')
  }

  const handleMarkAllRead = () => {
    setNotifications((prev = []) => prev.map(n => ({ ...n, isRead: true })))
    toast.success('All notifications marked as read')
  }

  const handleClearAll = () => {
    setNotifications([])
    toast.success('All notifications cleared')
  }

  const handleAddTestNotification = () => {
    const types: DemoNotification['type'][] = ['order', 'stock', 'customer', 'system']
    const randomType = types[Math.floor(Math.random() * types.length)]
    const newNotification = addRandomNotification(randomType)
    
    setNotifications((prev = []) => [newNotification, ...prev])
    toast.success('Test notification added')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Notification Center</h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'All notifications read'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTestNotification}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Clear All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear All Notifications</DialogTitle>
                <DialogDescription>
                  Are you sure you want to clear all notifications? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Priority:</label>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
              </Button>
            </div>

            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredNotifications.length} notification{filteredNotifications.length === 1 ? '' : 's'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {showUnreadOnly 
                  ? "No unread notifications at the moment"
                  : "All caught up! No notifications to show."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))
        )}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {notifications.filter(n => n.type === 'order').length}
              </div>
              <div className="text-sm text-muted-foreground">Order Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.type === 'stock').length}
              </div>
              <div className="text-sm text-muted-foreground">Stock Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'customer').length}
              </div>
              <div className="text-sm text-muted-foreground">Customer Activity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {notifications.filter(n => n.type === 'system').length}
              </div>
              <div className="text-sm text-muted-foreground">System Updates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}