import React, { useState, useEffect } from 'react';
import { Bell, Briefcase, Calendar, AlertCircle, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../lib/notifications';
import { AppNotification } from '../types';
import { toast } from 'sonner';

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = getNotifications(auth.currentUser.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(notifications);
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Calendar size={20} className="text-blue-500" />;
      case 'job': return <Briefcase size={20} className="text-indigo-500" />;
      default: return <AlertCircle size={20} className="text-slate-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Bell className="text-slate-400" />
                Notification Center
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle2 size={16} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications yet</h3>
                <p className="text-slate-500">When you get reminders or updates, they'll show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-6 flex gap-4 transition-colors ${n.unread ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.unread ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {getIcon(n.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-base ${n.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {n.title}
                        </h4>
                        <p className={`mt-1 text-sm ${n.unread ? 'text-slate-600' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {n.unread && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                            title="Mark as read"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-400 flex items-center gap-2">
                      <span title={formatFullDate(n.timestamp)}>{formatTime(n.timestamp)}</span>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
