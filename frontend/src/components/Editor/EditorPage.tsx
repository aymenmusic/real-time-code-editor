import { useEffect } from 'react';
import CodeEditor from './CodeEditor';
import UserPresence from './UserPresence';
import Chat from './Chat';
import Terminal from './Terminal';
import RunButton from './RunButton';
import Header from '../common/Header';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { websocketService } from '../../services/websocketService';

const EditorPage = () => {
  const { isDarkMode } = useThemeStore();

  // Get authentication state
  const { isAuthenticated, user } = useAuthStore();
  
  // Connect to WebSocket and handle real-time events
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('Waiting for authentication... isAuthenticated:', isAuthenticated, 'user:', user);
      return;
    }

    console.log('Setting up WebSocket connection...');
    
    const editorStore = useEditorStore.getState();
    const chatStore = useChatStore.getState();
    
    // Assign color from a hardcoded list based on user ID
    const colors = ['#354889', '#9CC8EA', '#4D9EE8', '#578CD3', '#384B8C'];
    const colorIndex = parseInt(user.id.toString()) % colors.length;
    const userColor = colors[colorIndex];
    
    const currentUser = {
      id: user.id.toString(),
      name: user.username,
      color: userColor
    };

    // Set up message handlers BEFORE connecting
    const handleUsersList = (data: any) => {
      console.log('Users list received:', data.users);
      editorStore.setUsers(data.users);
    };

    const handleUserJoined = (data: any) => {
      console.log('User joined:', data.user);
      editorStore.addUser(data.user);
    };

    const handleUserLeft = (data: any) => {
      console.log('User left:', data.user);
      editorStore.removeUser(data.user.id);
    };

    const handleCodeChange = (data: any) => {
      console.log('Code change from:', data.userName);
      // Update code without triggering another WebSocket send
      editorStore.updateCode(data.code);
    };

    const handleChatMessage = (data: any) => {
      console.log('Chat message received:', data.message);
      chatStore.addMessage({
        userId: data.message.userId,
        userName: data.message.userName,
        text: data.message.text,
      });
    };

    const handleLanguageChange = (data: any) => {
      console.log('Language changed to:', data.language);
      editorStore.setLanguage(data.language);
    };

    // Register handlers
    websocketService.on('users_list', handleUsersList);
    websocketService.on('user_joined', handleUserJoined);
    websocketService.on('user_left', handleUserLeft);
    websocketService.on('code_change', handleCodeChange);
    websocketService.on('chat_message', handleChatMessage);
    websocketService.on('language_change', handleLanguageChange);

    // Connect to WebSocket (will skip if already connected)
    websocketService.connect(currentUser);

    editorStore.setIsConnected(true);

    // Cleanup function - DON'T disconnect, just remove handlers
    return () => {
      console.log('Cleaning up message handlers (keeping connection)...');
      websocketService.off('users_list', handleUsersList);
      websocketService.off('user_joined', handleUserJoined);
      websocketService.off('user_left', handleUserLeft);
      websocketService.off('code_change', handleCodeChange);
      websocketService.off('chat_message', handleChatMessage);
      websocketService.off('language_change', handleLanguageChange);
      
      // Clear chat messages when leaving editor
      chatStore.clearMessages();
      
      // DON'T disconnect here - let it stay connected
    };
  }, [isAuthenticated, user]);
  
  // Log code changes
  useEffect(() => {
    console.log('Setting up code change logging...');
    
    // Subscribe to code changes
    const unsubscribe = useEditorStore.subscribe((state) => {
      // Just log code changes for now
      console.log('Code changed, length:', state.code.length);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className={`editor-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header showNavLinks={true} isEditorPage={true} />
      
      <div className="editor-content">
        <div className="editor-main">
          <div className="editor-panel">
            <CodeEditor />
          </div>
          <div className="terminal-panel">
            <Terminal />
          </div>
        </div>
        
        <div className="editor-sidebar">
          <div className="editor-actions">
            <RunButton />
          </div>
          <UserPresence />
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
