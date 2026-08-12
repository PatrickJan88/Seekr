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
    <div className="min-h-screen bg-[#faf9f7] font-sans text-[#121722] pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-xs">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-[#efefef] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
                <Bell className="text-[#0068f9]" />
                Notification Center
              </h1>
              <p className="text-[#777c86] text-xs mt-1">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] hover:bg-white text-[#121722] border border-[#efefef] rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer"
              >
                <CheckCircle2 size={16} className="text-[#0068f9]" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-[#efefef]">
            {loading ? (
              <div className="p-12 text-center text-[#777c86] text-xs">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-[#faf9f7] border border-[#efefef] rounded-full flex items-center justify-center mb-4">
                  <Bell size={32} className="text-[#777c86]" />
                </div>
                <h3 className="text-base font-semibold text-[#121722] mb-1">No notifications yet</h3>
                <p className="text-[#777c86] text-xs">When you get reminders or updates, they'll show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-6 flex gap-4 transition-colors ${n.unread ? 'bg-[#faf9f7]' : 'hover:bg-[#faf9f7]/50'}`}
                >
                  <div className="shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.unread ? 'bg-[#0068f9]/10 text-[#0068f9]' : 'bg-[#faf9f7] text-[#777c86] border border-[#efefef]'}`}>
                      {getIcon(n.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-sm ${n.unread ? 'font-bold text-[#121722]' : 'font-medium text-[#777c86]'}`}>
                          {n.title}
                        </h4>
                        <p className={`mt-1 text-xs ${n.unread ? 'text-[#121722]' : 'text-[#777c86]'}`}>
                          {n.message}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {n.unread && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-2 text-[#0068f9] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#efefef] cursor-pointer"
                            title="Mark as read"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-2 text-[#777c86] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-[#777c86] flex items-center gap-2">
                      <span title={formatFullDate(n.timestamp)}>{formatTime(n.timestamp)}</span>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9]"></span>}
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
