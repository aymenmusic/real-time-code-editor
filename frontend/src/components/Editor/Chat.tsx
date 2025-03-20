import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';

const Chat = () => {
  const [message, setMessage] = useState('');
  const { messages, addMessage } = useChatStore();
  const { users } = useEditorStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    // Get the current user from auth store
    const { user, isAuthenticated } = useAuthStore.getState();
    
    // If authenticated, use the real user info
    // Otherwise, use a placeholder for guest users
    const currentUser = isAuthenticated && user ? {
      id: user.id.toString(),
      name: user.username,
    } : {
      id: 'guest-user',
      name: 'Guest',
    };
    
    // Add message to local store
    addMessage({
      userId: currentUser.id,
      userName: currentUser.name,
      text: message,
    });
    
    // Clear the input field
    setMessage('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.userId === 'current-user' ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-user">{msg.userName}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
