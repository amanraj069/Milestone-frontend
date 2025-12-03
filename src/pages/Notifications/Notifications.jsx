import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../components/DashboardPage';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '../../redux/slices/notificationsSlice';

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await dispatch(markNotificationAsRead(notification.notificationId));
    }
    navigate(`/jobs/${notification.jobId}?tab=questions`);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await dispatch(deleteNotification(notificationId));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const headerAction = unreadCount > 0 ? (
    <button
      onClick={handleMarkAllRead}
      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
    >
      Mark All Read
    </button>
  ) : null;

  return (
    <DashboardPage title="Notifications" headerAction={headerAction}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Unread</p>
          <p className="text-2xl font-semibold text-gray-900">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Read</p>
          <p className="text-2xl font-semibold text-gray-900">{notifications.length - unreadCount}</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500 mt-0.5">Questions and answers on jobs</p>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-500 mt-3">Loading notifications...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700">No notifications yet</p>
              <p className="text-gray-500 mt-1">When someone asks a question or answers your query, you'll see it here.</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.notificationId}
                  className={`border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          notification.type === 'question_posted' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {notification.type === 'question_posted' ? 'Question' : 'Answer'}
                        </span>
                        {!notification.read && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{notification.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-sm text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                        {notification.fromUserName && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">from {notification.fromUserName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, notification.notificationId)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default Notifications;
