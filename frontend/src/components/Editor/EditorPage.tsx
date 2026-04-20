import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { roomId } = useParams<{ roomId: string }>();
  const { isDarkMode } = useThemeStore();

  // Get authentication state
  const { isAuthenticated, user } = useAuthStore();
  
  // Connect to WebSocket and handle real-time events
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const editorStore = useEditorStore.getState();
    const chatStore = useChatStore.getState();
    
    // Point the WebSocket singleton at this room before connecting
    if (roomId) {
      websocketService.setRoom(roomId);
    }

    // 12 perceptually-distinct colors spanning the full hue range.
    // Chosen from the Tailwind v2 palette so they read well on both
    // light and dark backgrounds.
    const colors = [
      '#e53e3e', // red
      '#ed8936', // orange
      '#d69e2e', // amber
      '#38a169', // green
      '#319795', // teal
      '#3182ce', // blue
      '#5a67d8', // indigo
      '#805ad5', // purple
      '#d53f8c', // pink
      '#48bb78', // mint
      '#4299e1', // sky
      '#f687b3', // rose
    ];
    const colorIndex = parseInt(user.id.toString()) % colors.length;
    const userColor = colors[colorIndex];
    
    const currentUser = {
      id: user.id.toString(),
      name: user.username,
      color: userColor
    };

    // Optimistically add yourself to the users list immediately
    // This prevents showing "No users connected" during the brief connection delay
    editorStore.addUser(currentUser);

    // Set up message handlers BEFORE connecting
    const handleUsersList = (data: any) => {
      // Make sure you're in the list (in case the optimistic add was cleared)
      const usersWithSelf = data.users.some((u: any) => u.id === currentUser.id) 
        ? data.users 
        : [...data.users, currentUser];
      editorStore.setUsers(usersWithSelf);
    };

    const handleUserJoined = (data: any) => {
      editorStore.addUser(data.user);
    };

    const handleUserLeft = (data: any) => {
      // Don't remove yourself from the list - this prevents flickering on refresh
      // When you refresh, you receive your own user_left event before reconnecting
      if (data.user.id !== currentUser.id) {
        editorStore.removeUser(data.user.id);
        // Also clear their cursor decoration so it doesn't linger
        editorStore.removeUserCursor(data.user.id);
      }
    };

    const handleCodeChange = (data: any) => {
      // Update code without triggering another WebSocket send
      editorStore.updateCode(data.code);
    };

    const handleChatMessage = (data: any) => {
      chatStore.addMessage({
        userId: data.message.userId,
        userName: data.message.userName,
        text: data.message.text,
      });
    };

    const handleLanguageChange = (data: any) => {
      editorStore.setLanguage(data.language);
    };

    // Cursor move: update the live position for a remote user
    const handleCursorMove = (data: any) => {
      // Ignore our own cursor broadcast (we see it natively in the editor)
      if (data.userId === currentUser.id) return;
      editorStore.setUserCursor({
        userId: data.userId,
        userName: data.userName,
        color: data.color,
        lineNumber: data.lineNumber,
        column: data.column,
        selection: data.selection,
      });
    };

    // Register handlers
    websocketService.on('users_list', handleUsersList);
    websocketService.on('user_joined', handleUserJoined);
    websocketService.on('user_left', handleUserLeft);
    websocketService.on('code_change', handleCodeChange);
    websocketService.on('chat_message', handleChatMessage);
    websocketService.on('language_change', handleLanguageChange);
    websocketService.on('cursor_move', handleCursorMove);

    // Connect to WebSocket (will skip if already connected)
    websocketService.connect(currentUser);

    editorStore.setIsConnected(true);

    // Cleanup function - DON'T disconnect, just remove handlers
    return () => {
      websocketService.off('users_list', handleUsersList);
      websocketService.off('user_joined', handleUserJoined);
      websocketService.off('user_left', handleUserLeft);
      websocketService.off('code_change', handleCodeChange);
      websocketService.off('chat_message', handleChatMessage);
      websocketService.off('language_change', handleLanguageChange);
      websocketService.off('cursor_move', handleCursorMove);

      // Clear chat messages and all cursor decorations when leaving
      chatStore.clearMessages();
      editorStore.clearUserCursors();

      // DON'T disconnect here - let it stay connected
    };
  }, [isAuthenticated, user]);
  
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
