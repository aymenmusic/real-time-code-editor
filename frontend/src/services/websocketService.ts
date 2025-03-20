import { useAuthStore } from '../store/authStore';
import { useEditorStore, User } from '../store/editorStore';
import { useChatStore } from '../store/chatStore';

// WebSocket connection URL
const WS_URL = 'ws://localhost:8000';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private isAuthenticated = false;
  private token = '';
  private connected = false;

  // Initialize the WebSocket connection
  public connect(isAuthenticated: boolean, token: string = '') {
    this.isAuthenticated = isAuthenticated;
    this.token = token;

    // Close existing connection if any
    if (this.socket) {
      this.socket.close();
    }

    // Try connecting with authentication first if authenticated
    if (isAuthenticated && token) {
      this.connectWithAuth(token);
    } else {
      this.connectAnonymously();
    }
  }

  // Connect with authentication
  private connectWithAuth(token: string) {
    const url = `${WS_URL}/ws/auth?token=${token}`;
    console.log(`Connecting to WebSocket with auth at: ${url}`);
    
    try {
      this.socket = new WebSocket(url);
      console.log('WebSocket instance created (authenticated)');
      
      // Set up event handlers with fallback to anonymous connection
      this.setupEventHandlers(true);
    } catch (error) {
      console.error('Error creating authenticated WebSocket connection:', error);
      // Fall back to anonymous connection
      this.connectAnonymously();
    }
  }

  // Connect anonymously
  private connectAnonymously() {
    const url = `${WS_URL}/ws`;
    console.log(`Connecting to WebSocket anonymously at: ${url}`);
    
    try {
      this.socket = new WebSocket(url);
      console.log('WebSocket instance created (anonymous)');
      
      // Set up event handlers without fallback
      this.setupEventHandlers(false);
    } catch (error) {
      console.error('Error creating anonymous WebSocket connection:', error);
    }
  }

  // Set up WebSocket event handlers
  private setupEventHandlers(withFallback: boolean = false) {
    if (!this.socket) return;

    // Connection opened
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      this.connected = true;
      
      // Update connection status in the store
      const editorStore = useEditorStore.getState();
      editorStore.setIsConnected(true);
    };

    // Connection closed
    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event);
      this.connected = false;
      
      // Update connection status in the store
      const editorStore = useEditorStore.getState();
      editorStore.setIsConnected(false);
      
      // Attempt to reconnect
      this.attemptReconnect();
    };

    // Connection error
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      // If this was an authenticated connection attempt, fall back to anonymous
      if (withFallback) {
        console.log('Falling back to anonymous connection');
        this.connectAnonymously();
      }
    };

    // Message received
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  // Handle incoming WebSocket messages
  private handleMessage(data: any) {
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'users_update':
        // Update the list of connected users
        console.log('Updating users list:', data.users);
        const editorStore = useEditorStore.getState();
        console.log('Current users in store before update:', editorStore.users);
        editorStore.setUsers(data.users);
        console.log('Current users in store after update:', editorStore.users);
        
        // Verify the store was updated correctly
        setTimeout(() => {
          const updatedStore = useEditorStore.getState();
          console.log('Users in store after timeout:', updatedStore.users);
        }, 100);
        break;
      
      case 'chat_message':
        // Add a new chat message
        console.log('Received chat message:', data.message);
        const chatStore = useChatStore.getState();
        chatStore.addMessage({
          userId: data.user.id,
          userName: data.user.name,
          text: data.message
        });
        break;
      
      case 'code_update':
        // Update the code in the editor
        console.log('Received code update');
        const editorStoreForCode = useEditorStore.getState();
        editorStoreForCode.updateCode(data.code);
        break;
      
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  // Send a chat message
  public sendChatMessage(message: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const data = {
      type: 'chat_message',
      message
    };

    this.socket.send(JSON.stringify(data));
  }

  // Send a code update
  public sendCodeUpdate(code: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const data = {
      type: 'code_update',
      code
    };

    this.socket.send(JSON.stringify(data));
  }

  // Attempt to reconnect to the WebSocket server
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.isAuthenticated, this.token);
    }, delay);
  }

  // Check if the WebSocket is connected
  public isConnected(): boolean {
    return this.connected && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Disconnect from the WebSocket server
  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.connected = false;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
