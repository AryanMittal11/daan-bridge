import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle, ShieldAlert, X } from 'lucide-react';
import API from '../api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'ADMIN';
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onCountChange: (count: number) => void;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  URGENT: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-red-500',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
  },
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-l-emerald-500',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-l-blue-500',
  },
  ADMIN: {
    icon: ShieldAlert,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-l-purple-500',
  },
};

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onCountChange,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      onCountChange(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.read) {
        onCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[32rem] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden z-50 animate-in"
      style={{
        animation: 'slideDown 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto max-h-[26rem] custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              You'll be notified about important events here
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.INFO;
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-all duration-150 border-l-4 ${config.border} ${
                  notif.read
                    ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    : `${config.bg} hover:opacity-90`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            className="p-1 rounded hover:bg-white/50 dark:hover:bg-slate-600/50 text-slate-400 hover:text-emerald-500 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notif.id, e)}
                          className="p-1 rounded hover:bg-white/50 dark:hover:bg-slate-600/50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${notif.read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};
