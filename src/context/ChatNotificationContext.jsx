import { createContext, useContext, useState, useEffect } from 'react';

const ChatNotificationContext = createContext();

export const useChatNotifications = () => {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotifications must be used within ChatNotificationProvider');
  }
  return context;
};

export const ChatNotificationProvider = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Listen to localStorage changes for cross-component updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'chatUnreadCount') {
        setTotalUnreadCount(parseInt(e.newValue || '0', 10));
      }
    };

    // Check initial value
    const stored = localStorage.getItem('chatUnreadCount');
    if (stored) {
      setTotalUnreadCount(parseInt(stored, 10));
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateUnreadCount = (count) => {
    setTotalUnreadCount(count);
    localStorage.setItem('chatUnreadCount', count.toString());
    // Trigger custom event for same-window updates
    window.dispatchEvent(new CustomEvent('chatUnreadCountChanged', { detail: count }));
  };

  // Listen to custom event for same-window updates
  useEffect(() => {
    const handleCustomEvent = (e) => {
      setTotalUnreadCount(e.detail);
    };

    window.addEventListener('chatUnreadCountChanged', handleCustomEvent);
    return () => window.removeEventListener('chatUnreadCountChanged', handleCustomEvent);
  }, []);

  return (
    <ChatNotificationContext.Provider value={{ totalUnreadCount, updateUnreadCount }}>
      {children}
    </ChatNotificationContext.Provider>
  );
};
