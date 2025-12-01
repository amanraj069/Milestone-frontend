import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const openChatWith = (userId) => {
    console.log('Opening chat with userId:', userId);
    setSelectedUserId(userId);
    
    // Navigate to chat page based on current user's role
    if (user?.role) {
      const chatPath = `/${user.role.toLowerCase()}/chat`;
      navigate(chatPath);
    }
  };

  const clearSelectedUser = () => {
    setSelectedUserId(null);
  };

  const value = {
    selectedUserId,
    openChatWith,
    clearSelectedUser,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};