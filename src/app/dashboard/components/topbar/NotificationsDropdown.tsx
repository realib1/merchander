'use client';

import { useState } from 'react';
import { Bell, ShoppingBag, Package, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationsDropdownProps {
  initialNotifications?: Notification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function NotificationsDropdown({
  initialNotifications = [],
  isOpen,
  onToggle,
  onClose,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    const old = [...notifications];
    setNotifications([]);
    const res = await markAllNotificationsAsRead();
    if (!res.success) {
      setNotifications(old);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    onClose();
    await markNotificationAsRead(notif.id);
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="View notifications"
        className="relative p-2 hover:bg-surface-elevated hover:text-brand-primary rounded-full transition-colors cursor-pointer"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full border border-background" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-surface border border-separator rounded-xl shadow-lg z-50 overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-separator/50 flex items-center justify-between bg-surface/50">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <Bell size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  let Icon = Bell;
                  let colorClass = 'bg-brand-primary/10 text-brand-primary';

                  if (notif.type === 'order') {
                    Icon = ShoppingBag;
                    colorClass = 'bg-blue-500/10 text-blue-500';
                  } else if (notif.type === 'inventory') {
                    Icon = Package;
                    colorClass = 'bg-amber-500/10 text-amber-500';
                  } else if (notif.type === 'payment') {
                    Icon = Check;
                    colorClass = 'bg-emerald-500/10 text-emerald-500';
                  }

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="p-3 border-b border-separator/30 hover:bg-surface-elevated transition-colors cursor-pointer group flex gap-3 relative bg-surface-elevated/30"
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full" />
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}
                      >
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-brand-primary transition-colors leading-tight mb-1">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-muted/70 mt-1 font-medium capitalize">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-separator/50 bg-surface/50">
              <button
                onClick={onClose}
                className="w-full py-1.5 text-xs text-center font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
