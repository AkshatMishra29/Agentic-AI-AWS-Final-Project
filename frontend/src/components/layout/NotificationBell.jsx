import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiInfo, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { getMyNotifications, markNotificationRead } from '../../api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await getMyNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  // Poll every 10s so new application notifications appear quickly
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refresh immediately every time dropdown is opened
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
    fetchNotifications();
  };

  const iconFor = (type) => {
    if (type === 'new_application') return <FiUsers className="w-4 h-4" />;
    return <FiInfo className="w-4 h-4" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition cursor-pointer"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[9px]">
                  {unreadCount}
                </span>
              )}
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchNotifications(true)}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-md transition"
                title="Refresh"
              >
                <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs flex items-start space-x-3 transition ${
                    item.read ? 'bg-transparent opacity-60' : 'bg-indigo-50/60 dark:bg-indigo-950/20'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                    item.type === 'new_application'
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
                      : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                  }`}>
                    {iconFor(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 font-medium leading-snug">{item.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!item.read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition flex-shrink-0"
                      title="Mark as read"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
