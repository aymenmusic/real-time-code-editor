class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string = 'main';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private messageHandlers: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;
  private currentUser: { id: string; name: string; color: string } | null = null;

  connect(user: { id: string; name: string; color: string }) {
    // If already connected with the same user, just return
    if (this.isConnected() && this.currentUser?.id === user.id) {
      console.log('Already connected as same user, skipping...');
      return;
    }

    // If connecting or connected as different user, disconnect first
    if ((this.isConnecting || this.isConnected()) && this.currentUser?.id !== user.id) {
      console.log('Disconnecting previous connection before reconnecting...');
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentUser = user;

    // Use environment variable for WebSocket URL
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${wsBaseUrl}/ws/${this.roomId}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Send initial message with user info
      this.send({
        type: 'init',
        user: {
          id: user.id,
          name: user.name,
          color: user.color
        }
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Call registered handlers for this message type
        const handlers = this.messageHandlers.get(data.type) || [];
        handlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.ws = null;
      this.isConnecting = false;
      
      // Attempt to reconnect only if we have user info
      if (this.currentUser && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        setTimeout(() => {
          if (this.currentUser) {
            this.connect(this.currentUser);
          }
        }, this.reconnectDelay);
      }
    };
  }

  disconnect() {
    this.currentUser = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.messageHandlers.clear();
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }

  // Register a handler for a specific message type
  on(messageType: string, handler: Function) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  // Unregister a handler
  off(messageType: string, handler: Function) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Send code changes
  sendCodeChange(code: string) {
    this.send({
      type: 'code_change',
      code
    });
  }

  // Send chat message
  sendChatMessage(text: string) {
    this.send({
      type: 'chat_message',
      text,
      timestamp: Date.now()
    });
  }

  // Send language change
  sendLanguageChange(language: string) {
    this.send({
      type: 'language_change',
      language
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();
