import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import "./Chat.css";

const EMOJIS = ["😀", "😂", "😊", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🎉", "🔥", "✨", "💯"];

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
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
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("message:new", handleNewMessage);
    socket.on("message:sent", handleMessageSent);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("user:status", handleUserStatus);
    socket.on("message:read", handleMessageRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:sent", handleMessageSent);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("user:status", handleUserStatus);
      socket.off("message:read", handleMessageRead);
    };
  }, [socket, isConnected, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get("http://localhost:9000/api/chat/conversations", {
        withCredentials: true,
      });
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const response = await axios.get(`http://localhost:9000/api/chat/messages/${otherUserId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setMessages(response.data.messages);
        
        // Mark as read
        if (response.data.conversationId) {
          await axios.put(
            `http://localhost:9000/api/chat/conversations/${response.data.conversationId}/read`,
            {},
            { withCredentials: true }
          );
          
          // Update conversations list
          setConversations(prev =>
            prev.map(conv =>
              conv.conversationId === response.data.conversationId
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        }
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
        `http://localhost:9000/api/chat/messages/${selectedConversation.participant.userId}`,
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

  const handleNewMessage = (message) => {
    // If this message is for the current conversation, add it
    if (selectedConversation?.participant.userId === message.from) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read immediately
      if (message.conversationId) {
        axios.put(
          `http://localhost:9000/api/chat/conversations/${message.conversationId}/read`,
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
    // Message already added optimistically
    console.log("Message sent confirmation:", message);
  };

  const handleTypingUpdate = ({ userId, isTyping }) => {
    if (selectedConversation?.participant.userId === userId) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }
  };

  const handleUserStatus = ({ userId, status }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (status === "online") {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleMessageRead = ({ conversationId }) => {
    // Update messages to show as read
    setMessages(prev =>
      prev.map(msg =>
        msg.conversationId === conversationId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const updateConversationLastMessage = (message) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.participant.userId === message.from || conv.participant.userId === message.to
          ? {
              ...conv,
              lastMessage: {
                messageId: message.messageId,
                text: message.messageData,
                sender: message.from,
                timestamp: message.createdAt,
              },
              updatedAt: message.createdAt,
            }
          : conv
      );
      // Sort by most recent
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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
      const response = await axios.get(`http://localhost:9000/api/chat/search-users?query=${query}`, {
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
    // Check if conversation already exists
    let existingConv = conversations.find(
      conv => conv.participant.userId === user.userId
    );

    if (!existingConv) {
      // Create a temporary conversation object
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

    // Emit typing event
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
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If today, show time
    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const addEmoji = (emoji) => {
    setMessageInput(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      {/* Conversations Sidebar */}
      <div className="conversations-sidebar">
        <div className="conversations-header">
          <h2>Messages</h2>
          <div className="search-box">
            <span className="search-icon">🔍</span>
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
        </div>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No conversations yet.<br />Search for people to start chatting!</p>
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
                  <span className={`online-indicator ${onlineUsers.has(conversation.participant.userId) ? '' : 'offline'}`}></span>
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="conversation-name">
                      {conversation.participant.name}
                      <span className="role-badge">{conversation.participant.role}</span>
                    </span>
                    {conversation.lastMessage && (
                      <span className="conversation-time">
                        {formatTime(conversation.lastMessage.timestamp)}
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
                {conversation.unreadCount > 0 && (
                  <span className="unread-badge">{conversation.unreadCount}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  <img src={selectedConversation.participant.picture} alt={selectedConversation.participant.name} />
                </div>
                <div className="chat-header-details">
                  <h3>{selectedConversation.participant.name}</h3>
                  <div className="chat-header-status">
                    {typingUsers.has(selectedConversation.participant.userId)
                      ? "Typing..."
                      : onlineUsers.has(selectedConversation.participant.userId)
                      ? "Online"
                      : "Offline"}
                  </div>
                </div>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.messageId}
                  className={`message ${message.from === user.id ? 'sent' : 'received'}`}
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
                          ↩️
                        </button>
                      </div>
                    </div>
                    <div className="message-footer">
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                      {message.from === user.id && message.isRead && (
                        <span style={{ color: '#667eea' }}>✓✓</span>
                      )}
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
                  ➤
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
  );
};

export default Chat;
