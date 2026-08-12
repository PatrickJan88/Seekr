import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Tabs from '@radix-ui/react-tabs';
import { Bell, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications';
import { AppNotification } from '../types';

export function NotificationCenter({ onViewAll }: { onViewAll: () => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState("all");
  
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = getNotifications(auth.currentUser.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filtered = tab === "unread" ? notifications.filter((n) => n.unread) : notifications;

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(notifications);
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

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          title="Notifications" 
          className="relative w-10 h-10 rounded-full bg-white border border-[#efefef] shadow-2xs flex items-center justify-center text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] transition-all cursor-pointer focus:outline-none"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#0068f9] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-4 text-center border border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content className="w-[380px] bg-white rounded-2xl shadow-lg border border-[#efefef] overflow-hidden z-50 mr-4" sideOffset={8}>
          <Tabs.Root value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between border-b border-[#efefef] px-4 py-3 bg-[#faf9f7]">
              <Tabs.List className="flex gap-4">
                <Tabs.Trigger value="all" className="text-xs font-semibold text-[#777c86] data-[state=active]:text-[#121722] data-[state=active]:border-b-2 data-[state=active]:border-[#0068f9] pb-1 -mb-3 transition-colors cursor-pointer">
                  All
                </Tabs.Trigger>
                <Tabs.Trigger value="unread" className="text-xs font-semibold text-[#777c86] data-[state=active]:text-[#121722] data-[state=active]:border-b-2 data-[state=active]:border-[#0068f9] pb-1 -mb-3 transition-colors flex items-center gap-1.5 cursor-pointer">
                  Unread
                  {unreadCount > 0 && (
                    <span className="bg-white text-[#121722] border border-[#efefef] text-[10px] px-1.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Tabs.Trigger>
              </Tabs.List>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-[#0068f9] hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-[#777c86] flex flex-col items-center gap-2">
                  <Bell size={24} className="text-[#a5a5a5]" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[#efefef]">
                  {filtered.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-[#faf9f7] cursor-pointer ${n.unread ? 'bg-[#faf9f7]/60' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs ${n.unread ? 'font-bold text-[#121722]' : 'font-medium text-[#777c86]'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-[#777c86] leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-[#a5a5a5] font-medium">
                          {formatTime(n.timestamp)}
                        </p>
                      </div>
                      {n.unread && (
                        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#0068f9]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tabs.Root>
          
          <div className="p-2.5 border-t border-[#efefef] bg-[#faf9f7]">
             <button onClick={onViewAll} className="w-full py-2 text-xs font-semibold text-[#121722] hover:text-[#0068f9] transition-colors cursor-pointer">
               View all notifications
             </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
