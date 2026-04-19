import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useChatContext } from "../../context/ChatContext";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { graphqlRequest } from "../../utils/graphqlClient";
import DashboardLayout from "../DashboardLayout";
import "./Chat.css";
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const EMOJIS = ["😀", "😂", "😊", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🎉", "🔥", "✨", "💯"];
const API_BASE_URL = getBackendBaseUrl();

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { selectedUserId, clearSelectedUser } = useChatContext();
  const { updateUnreadCount } = useChatNotifications();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768);
  const [isConversationsSidebarCollapsed, setIsConversationsSidebarCollapsed] = useState(() => {
    // Auto-collapse only on tablet widths, not phones
    return window.innerWidth >= 768 && window.innerWidth < 1080;
  });
  const [contextMenu, setContextMenu] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Handle responsive sidebar collapse on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);

      if (mobile) {
        setIsConversationsSidebarCollapsed(false);
      } else if (window.innerWidth < 1080 && !isConversationsSidebarCollapsed) {
        setIsConversationsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-select conversation when coming from context
  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const existingConv = conversations.find(
        conv => conv.participant.userId === selectedUserId
      );
      
      if (existingConv) {
        handleConversationSelect(existingConv);
      } else {
        // If conversation doesn't exist, search for the user
        searchAndSelectUser(selectedUserId);
      }
      
      // Clear the context after using it
      clearSelectedUser();
    }
  }, [selectedUserId, conversations]);

  const searchAndSelectUser = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/search-users?query=${encodeURIComponent(userId)}`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        const targetUser = response.data.users.find(user => user.userId === userId);
        if (targetUser) {
          handleSearchResultClick(targetUser);
        }
      }
    } catch (error) {
      console.error('Error searching for user:', error);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handler for initial online users list
    const handleInitialOnlineUsers = ({ userIds }) => {
      console.log('Chat received users:online event with:', userIds);
      setOnlineUsers(new Set(userIds));
    };

    console.log('Setting up socket listeners for user:', user?.id, 'role:', user?.role);

    socket.on("message:new", handleNewMessage);
    socket.on("message:sent", handleMessageSent);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("user:status", handleUserStatus);
    socket.on("users:online", handleInitialOnlineUsers);
    socket.on("message:read", handleMessageRead);

    // Request current online users
    console.log('Requesting current online users from server');
    socket.emit("request:online-users");

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:sent", handleMessageSent);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("user:status", handleUserStatus);
      socket.off("users:online", handleInitialOnlineUsers);
      socket.off("message:read", handleMessageRead);
    };
  }, [socket, isConnected, selectedConversation]);

  // Log conversations and online users for debugging
  useEffect(() => {
    if (conversations.length > 0) {
      console.log('Current conversations:', conversations.map(c => ({
        name: c.participant.name,
        userId: c.participant.userId,
        role: c.participant.role
      })));
      console.log('Online users:', Array.from(onlineUsers));
    }
  }, [conversations, onlineUsers]);

  // Update total unread count whenever conversations change
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    updateUnreadCount(totalUnread);
  }, [conversations, updateUnreadCount]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      let fetchedConversations = [];

      const data = await graphqlRequest({
        query: `
          query ChatConversations($limit: Int!, $offset: Int!) {
            chatConversations(limit: $limit, offset: $offset) {
              conversationId
              unreadCount
              updatedAt
              participant {
                userId
                name
                picture
                role
              }
              lastMessage {
                messageId
                text
                sender
                timestamp
              }
            }
          }
        `,
        variables: {
          limit: 100,
          offset: 0,
        },
      });

      fetchedConversations = data?.chatConversations || [];

      console.log('Fetched conversations:', fetchedConversations.map(c => ({
        name: c.participant.name,
        userId: c.participant.userId
      })));
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      let fetchedMessages = [];
      let conversationId = null;

      const data = await graphqlRequest({
        query: `
          query MessagesWithUser($userId: String!, $limit: Int!, $offset: Int!) {
            messagesWithUser(userId: $userId, limit: $limit, offset: $offset) {
              conversationId
              messages {
                messageId
                conversationId
                from
                to
                messageData
                isRead
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: {
          userId: otherUserId,
          limit: 300,
          offset: 0,
        },
      });

      fetchedMessages = data?.messagesWithUser?.messages || [];
      conversationId = data?.messagesWithUser?.conversationId || null;

      setMessages(fetchedMessages);

      if (conversationId) {
        await axios.put(
          `${API_BASE_URL}/api/chat/conversations/${conversationId}/read`,
          {},
          { withCredentials: true }
        );

        setConversations(prev =>
          prev.map(conv =>
            conv.conversationId === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const messageData = {
      messageData: messageInput.trim(),
      replyTo: replyTo?.messageId || null,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/messages/${selectedConversation.participant.userId}`,
        messageData,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Emit socket event
        socket?.emit("message:send", {
          recipientId: selectedConversation.participant.userId,
          message: response.data.message,
        });

        // Add to local messages
        setMessages(prev => [...prev, response.data.message]);
        
        // Update conversation last message
        updateConversationLastMessage(response.data.message);
        
        // Clear input
        setMessageInput("");
        setReplyTo(null);
        setShowEmojiPicker(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/chat/messages/${messageId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove from local messages
        setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        
        // Emit socket event to notify other party
        if (selectedConversation) {
          socket?.emit("message:delete", {
            messageId,
            recipientId: selectedConversation.participant.userId,
          });
        }
        
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleRightClick = (e, message) => {
    e.preventDefault();
    if (message.from === user.id) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: message.messageId,
      });
    }
  };

  const handleDeleteClick = () => {
    if (contextMenu?.messageId) {
      deleteMessage(contextMenu.messageId);
    }
    setContextMenu(null);
  };

  const handleNewMessage = (message) => {
    // If this message is for the current conversation, add it
    if (selectedConversation?.participant.userId === message.from) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read immediately
      if (message.conversationId) {
        axios.put(
          `${API_BASE_URL}/api/chat/conversations/${message.conversationId}/read`,
          {},
          { withCredentials: true }
        );
      }
    } else {
      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv.participant.userId === message.from
            ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        )
      );
    }
    
    // Update last message in conversation
    updateConversationLastMessage(message);
    
    // Refresh conversations to get proper order
    fetchConversations();
  };

  const handleMessageSent = (message) => {
    console.log("Message sent confirmation:", message);
  };

  const handleMessageDeleted = ({ messageId }) => {
    // Remove message from local state
    setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
  };

  const handleTypingUpdate = ({ userId, isTyping }) => {
    console.log('Received typing:update:', { userId, isTyping, selectedUserId: selectedConversation?.participant.userId });
    if (selectedConversation?.participant.userId === userId) {
      console.log('   Updating typing state for current conversation');
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
          console.log('   Added to typing users:', userId);
        } else {
          newSet.delete(userId);
          console.log('   Removed from typing users:', userId);
        }
        console.log('   Typing users now:', Array.from(newSet));
        return newSet;
      });
    } else {
      console.log('   Typing update not for current conversation');
    }
  };

  const handleUserStatus = ({ userId, status }) => {
    console.log('User status update:', { userId, status, currentUser: user?.id });
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (status === "online") {
        newSet.add(userId);
        console.log('Added user to online:', userId, 'Total online:', newSet.size);
      } else {
        newSet.delete(userId);
        console.log('Removed user from online:', userId, 'Total online:', newSet.size);
      }
      console.log('Online users now:', Array.from(newSet));
      return newSet;
    });
  };

  const handleMessageRead = ({ conversationId }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.conversationId === conversationId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const resolveTimestamp = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const getSortableTime = (value) => {
    const parsed = resolveTimestamp(value);
    return parsed ? new Date(parsed).getTime() : 0;
  };

  const updateConversationLastMessage = (message) => {
    const messageTimestamp =
      resolveTimestamp(message.createdAt) ||
      resolveTimestamp(message.updatedAt) ||
      resolveTimestamp(message.timestamp) ||
      new Date().toISOString();

    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.participant.userId === message.from || conv.participant.userId === message.to
          ? {
              ...conv,
              lastMessage: {
                messageId: message.messageId,
                text: message.messageData,
                sender: message.from,
                timestamp: messageTimestamp,
              },
              updatedAt: messageTimestamp,
            }
          : conv
      );
      return updated.sort((a, b) => {
        const aTime = getSortableTime(a.lastMessage?.timestamp || a.updatedAt);
        const bTime = getSortableTime(b.lastMessage?.timestamp || b.updatedAt);
        return bTime - aTime;
      });
    });
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    await fetchMessages(conversation.participant.userId);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/search-users?query=${encodeURIComponent(query)}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSearchResultClick = async (user) => {
    let existingConv = conversations.find(
      conv => conv.participant.userId === user.userId
    );

    if (!existingConv) {
      existingConv = {
        conversationId: null,
        participant: user,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date(),
      };
      setConversations(prev => [existingConv, ...prev]);
    }

    setSelectedConversation(existingConv);
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (socket && selectedConversation) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.emit("typing:start", {
        conversationId: selectedConversation.conversationId,
        userId: user.id,
        recipientId: selectedConversation.participant.userId,
      });

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", {
          conversationId: selectedConversation.conversationId,
          userId: user.id,
          recipientId: selectedConversation.participant.userId,
        });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const resolved = resolveTimestamp(timestamp);
    if (!resolved) return "";
    const date = new Date(resolved);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const addEmoji = (emoji) => {
    setMessageInput(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  return (
    <DashboardLayout>
      <div className="chat-main-container">
        <div className="chat-layout">
          {/* Conversations Sidebar */}
          <div className={`conversations-sidebar ${isConversationsSidebarCollapsed ? 'collapsed' : ''} ${isMobileView && selectedConversation ? 'mobile-hidden' : ''}`}>
            <div className="conversations-header">
              <div className="conversations-header-top">
                <h2>Messages</h2>
                {!isMobileView && (
                  <button 
                    className="collapse-btn"
                    onClick={() => setIsConversationsSidebarCollapsed(!isConversationsSidebarCollapsed)}
                  >
                    {isConversationsSidebarCollapsed ? '←' : '→'}
                  </button>
                )}
              </div>
              {!isConversationsSidebarCollapsed && (
                <div className="search-box">
                  <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {isSearching && searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(user => (
                        <div
                          key={user.userId}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(user)}
                        >
                          <div className="search-result-avatar">
                            <img src={user.picture} alt={user.name} />
                          </div>
                          <div className="search-result-info">
                            <div className="search-result-name">{user.name}</div>
                            <div className="search-result-role">{user.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-conversations">
                  {!isConversationsSidebarCollapsed && (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>No conversations yet.<br />Search for people to start chatting!</p>
                    </>
                  )}
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation.participant.userId}
                    className={`conversation-item ${selectedConversation?.participant.userId === conversation.participant.userId ? 'active' : ''}`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="conversation-avatar">
                      <img src={conversation.participant.picture} alt={conversation.participant.name} />
                      <span 
                        className={`online-indicator ${onlineUsers.has(conversation.participant.userId) ? '' : 'offline'}`}
                        title={`${conversation.participant.name} - ${onlineUsers.has(conversation.participant.userId) ? 'Online' : 'Offline'}`}
                      ></span>
                    </div>
                    {!isConversationsSidebarCollapsed && (
                      <div className="conversation-info">
                        <div className="conversation-header">
                          <span className="conversation-name">
                            {conversation.participant.name}
                            <span className="role-badge">{conversation.participant.role}</span>
                          </span>
                          {(conversation.lastMessage || conversation.updatedAt) && (
                            <span className="conversation-time">
                              {formatTime(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="conversation-preview">
                            {conversation.lastMessage.sender === user.id ? 'You: ' : ''}
                            {conversation.lastMessage.text}
                          </p>
                        )}
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">{conversation.unreadCount}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`chat-area ${!isMobileView && !isConversationsSidebarCollapsed ? 'expanded-sidebar' : ''} ${isMobileView && !selectedConversation ? 'mobile-hidden' : ''}`}>
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    {isMobileView && (
                      <button
                        className="mobile-back-btn"
                        onClick={() => setSelectedConversation(null)}
                        aria-label="Back to conversations"
                      >
                        ←
                      </button>
                    )}
                    <div className="chat-header-avatar">
                      <img src={selectedConversation.participant.picture} alt={selectedConversation.participant.name} />
                    </div>
                    <div className="chat-header-details">
                      <h3>{selectedConversation.participant.name}</h3>
                      <div className="chat-header-status">
                        {(() => {
                          const isOnline = onlineUsers.has(selectedConversation.participant.userId);
                          console.log('Online status check:', selectedConversation.participant.name, '- userId:', selectedConversation.participant.userId, '- Online:', isOnline);
                          console.log('All online users:', Array.from(onlineUsers));
                          return typingUsers.has(selectedConversation.participant.userId)
                            ? "Typing..."
                            : isOnline
                            ? "Online"
                            : "Offline";
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.map(message => (
                    <div
                      key={message.messageId}
                      className={`message ${message.from === user.id ? 'sent' : 'received'}`}
                      onContextMenu={(e) => handleRightClick(e, message)}
                    >
                      <div className="message-content">
                        {message.replyTo && (
                          <div className="reply-reference">
                            <div className="reply-reference-sender">
                              {message.replyTo.sender === user.id ? 'You' : selectedConversation.participant.name}
                            </div>
                            <div className="reply-reference-text">{message.replyTo.text}</div>
                          </div>
                        )}
                        <div className="message-bubble">
                          <p className="message-text">{message.messageData}</p>
                          <div className="message-actions">
                            <button
                              className="message-action-btn"
                              onClick={() => handleReply(message)}
                              title="Reply"
                            >
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                          </div>
                          <div className="message-footer">
                            <span className="message-time">{formatTime(message.createdAt || message.updatedAt)}</span>
                            {message.from === user.id && (
                              <div className={`read-ticks ${message.isRead ? 'read' : 'unread'}`}>
                                <svg viewBox="0 0 24 24">
                                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                  <path d="M16.2 6.8L15 8l4.2 4.2L20.6 11l-4.4-4.2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {typingUsers.has(selectedConversation.participant.userId) && (
                  <div className="typing-indicator">
                    {selectedConversation.participant.name} is typing
                    <span className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                )}

                <div className="message-input-container">
                  {replyTo && (
                    <div className="reply-preview">
                      <div className="reply-preview-content">
                        <div className="reply-preview-label">Replying to</div>
                        <div className="reply-preview-text">{replyTo.messageData}</div>
                      </div>
                      <button className="reply-preview-close" onClick={() => setReplyTo(null)}>
                        ×
                      </button>
                    </div>
                  )}
                  <div className="message-input-wrapper">
                    <div className="emoji-picker-wrapper">
                      <button
                        className="emoji-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        type="button"
                      >
                        😊
                      </button>
                      {showEmojiPicker && (
                        <div className="emoji-picker-dropdown">
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => addEmoji(emoji)}
                              type="button"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      ref={messageInputRef}
                      className="message-input"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      rows={1}
                    />
                    <button
                      className="send-btn"
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-chat">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3>Welcome to Messages</h3>
                <p>Select a conversation or search for people to start chatting</p>
              </div>
            )}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="message-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="message-context-menu-item delete" onClick={handleDeleteClick}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Message
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Chat;
