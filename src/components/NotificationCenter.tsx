import React, { useState, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Tabs from '@radix-ui/react-tabs';
import { Bell, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/notifications';
import { AppNotification } from '../types';
import { computeDropdownAlign, DropdownAlign } from '../lib/utils';

export function NotificationCenter({ onViewAll, onNavigateToGhosted }: { onViewAll: () => void; onNavigateToGhosted?: (n: AppNotification) => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState("all");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuAlign, setMenuAlign] = useState<DropdownAlign>('start');
  
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
    <Popover.Root
      onOpenChange={(open) => {
        if (open) {
          setMenuAlign(computeDropdownAlign(triggerRef.current, 380));
        }
      }}
    >
      <Popover.Trigger asChild>
        <button 
          ref={triggerRef}
          title="Notifications" 
          className="relative w-[38px] h-[38px] rounded-lg bg-white border border-[#efefef] shadow-2xs flex items-center justify-center text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] transition-all cursor-pointer focus:outline-none"
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
        <Popover.Content align={menuAlign} collisionPadding={16} className="w-[380px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-lg border border-[#efefef] overflow-hidden z-50" sideOffset={8}>
          <Tabs.Root value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between border-b border-[#efefef] px-4 py-3 bg-white">
              <Tabs.List className="flex items-center gap-1 bg-[#faf9f7] h-[38px] p-1 border border-[#efefef] rounded-full text-[13px] font-medium shrink-0">
                <Tabs.Trigger
                  value="all"
                  className="h-full px-3.5 rounded-full flex items-center justify-center transition-all cursor-pointer border border-transparent text-[#777c86] hover:text-[#121722] data-[state=active]:bg-white data-[state=active]:text-[#121722] data-[state=active]:shadow-2xs data-[state=active]:font-bold data-[state=active]:border-[#efefef]"
                >
                  All
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="unread"
                  className="h-full px-3.5 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent text-[#777c86] hover:text-[#121722] data-[state=active]:bg-white data-[state=active]:text-[#121722] data-[state=active]:shadow-2xs data-[state=active]:font-bold data-[state=active]:border-[#efefef]"
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-[10px] flex items-center justify-center font-bold text-blue-700 border border-blue-200">
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
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleMarkAsRead(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMarkAsRead(n.id);
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-[#faf9f7] cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-[#0068f9] ${n.unread ? 'bg-[#faf9f7]/60' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-xs ${n.unread ? 'font-bold text-[#121722]' : 'font-medium text-[#777c86]'}`}>
                              {n.title}
                            </p>
                            {(n.title.toLowerCase().includes('ghosted') || n.type === 'status_update') && onNavigateToGhosted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(n.id);
                                  onNavigateToGhosted(n);
                                }}
                                className="text-[11px] font-semibold text-[#0068f9] hover:text-[#0051c2] hover:underline cursor-pointer bg-transparent border-0 p-0 transition-colors"
                              >
                                View in Ghosted
                              </button>
                            )}
                          </div>
                        </div>
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
                    </div>
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
