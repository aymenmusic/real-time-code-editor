import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { websocketService } from '../../services/websocketService';

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
    
    if (!isAuthenticated || !user) {
      console.warn('User must be authenticated to send messages');
      return;
    }
    
    // Send message via WebSocket
    // Don't add locally - it will come back via WebSocket broadcast
    websocketService.sendChatMessage(message);
    
    // Clear the input field
    setMessage('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if user is authenticated
  const { isAuthenticated } = useAuthStore();

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
              className={`message ${msg.userId === useAuthStore.getState().user?.id.toString() ? 'own-message' : ''}`}
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
      
      {isAuthenticated ? (
        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      ) : (
        <div className="chat-auth-message">
          <p>Please <a href="/register">sign up</a> or <a href="/login">log in</a> to use the chat feature.</p>
        </div>
      )}
    </div>
  );
};

export default Chat;
