import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, AlertCircle, CheckCircle2, Trash2, Bell } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getNotifications, markNotificationRead, deleteNotification, clearAllNotifications } from '../lib/notifications';
import { AppNotification } from '../types';
import { toast } from 'sonner';

interface NotificationsPageProps {
  onBack?: () => void;
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

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    await clearAllNotifications(notifications);
    toast.success('All notifications cleared');
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Calendar size={18} className="text-blue-500" />;
      case 'job': return <Briefcase size={18} className="text-indigo-500" />;
      default: return <AlertCircle size={18} className="text-slate-500" />;
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
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#efefef] flex items-center justify-between gap-4 bg-white shrink-0">
          <p className="text-sm font-semibold text-[#121722]">
            You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
          
          <button
            type="button"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="text-xs font-semibold text-[#0068f9] hover:underline disabled:text-[#a5a5a5] disabled:no-underline disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Scrollable List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#efefef]">
          {loading ? (
            <div className="p-12 text-center text-[#777c86] text-xs">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
              <div className="w-14 h-14 bg-[#faf9f7] border border-[#efefef] rounded-full flex items-center justify-center mb-3">
                <Bell size={22} className="text-[#a5a5a5]" />
              </div>
              <h3 className="text-sm font-semibold text-[#121722] mb-1">No notifications yet</h3>
              <p className="text-[#777c86] text-xs">When you get reminders or application updates, they'll show up here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-5 sm:p-6 flex gap-4 transition-colors ${n.unread ? 'bg-[#faf9f7]' : 'hover:bg-[#faf9f7]/50'}`}
              >
                <div className="shrink-0 mt-0.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${n.unread ? 'bg-[#0068f9]/10 text-[#0068f9]' : 'bg-[#faf9f7] text-[#777c86] border border-[#efefef]'}`}>
                    {getIcon(n.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-sm ${n.unread ? 'font-bold text-[#121722]' : 'font-medium text-[#777c86]'}`}>
                        {n.title}
                      </h4>
                      <p className={`mt-1 text-xs ${n.unread ? 'text-[#121722]' : 'text-[#777c86]'}`}>
                        {n.message}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {n.unread && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-1.5 text-[#0068f9] hover:bg-white rounded-full transition-colors border border-transparent hover:border-[#efefef] cursor-pointer"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1.5 text-[#777c86] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-[#777c86] flex items-center gap-2">
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
  );
}
