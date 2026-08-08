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
        <button className="relative w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all focus:outline-none">
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center border border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content className="w-[380px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 mr-4" sideOffset={5}>
          <Tabs.Root value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 bg-slate-50/50">
              <Tabs.List className="flex gap-4">
                <Tabs.Trigger value="all" className="text-sm font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 pb-1 -mb-2 transition-colors">
                  All
                </Tabs.Trigger>
                <Tabs.Trigger value="unread" className="text-sm font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 pb-1 -mb-2 transition-colors flex items-center gap-1.5">
                  Unread
                  {unreadCount > 0 && (
                    <span className="bg-slate-100 text-slate-700 text-xs px-1.5 rounded-md font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Tabs.Trigger>
              </Tabs.List>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                  <Bell size={24} className="text-slate-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${n.unread ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {formatTime(n.timestamp)}
                        </p>
                      </div>
                      {n.unread && (
                        <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tabs.Root>
          
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
             <button onClick={onViewAll} className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
               View all notifications
             </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
