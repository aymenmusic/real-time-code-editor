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
      return;
    }

    console.log('Setting up WebSocket connection...');
    
    const editorStore = useEditorStore.getState();
    const chatStore = useChatStore.getState();
    
    // Generate a random color for the user
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF6', '#F6FF33'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const currentUser = {
      id: user.id.toString(),
      name: user.username,
      color: randomColor
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
