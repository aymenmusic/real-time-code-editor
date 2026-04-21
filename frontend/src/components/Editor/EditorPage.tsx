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

  // Subscribe to the guide-cursor toast (shown when someone guides our cursor)
  const guideCursorToast    = useEditorStore(state => state.guideCursorToast);
  const setGuideCursorToast = useEditorStore(state => state.setGuideCursorToast);

  // Auto-dismiss the toast after 3.5 s
  useEffect(() => {
    if (!guideCursorToast) return;
    const timer = setTimeout(() => setGuideCursorToast(null), 3500);
    return () => clearTimeout(timer);
  }, [guideCursorToast, setGuideCursorToast]);

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
    editorStore.addUser(currentUser);

    const handleUsersList = (data: any) => {
      const usersWithSelf = data.users.some((u: any) => u.id === currentUser.id) 
        ? data.users 
        : [...data.users, currentUser];
      editorStore.setUsers(usersWithSelf);
    };

    const handleUserJoined = (data: any) => {
      editorStore.addUser(data.user);
    };

    const handleUserLeft = (data: any) => {
      if (data.user.id !== currentUser.id) {
        editorStore.removeUser(data.user.id);
        editorStore.removeUserCursor(data.user.id);
      }
    };

    const handleCodeChange = (data: any) => {
      editorStore.updateCode(data.code);
    };

    const handleChatMessage = (data: any) => {
      chatStore.addMessage({
        userId:   data.message.userId,
        userName: data.message.userName,
        text:     data.message.text,
      });
    };

    const handleLanguageChange = (data: any) => {
      editorStore.setLanguage(data.language);
    };

    const handleCursorMove = (data: any) => {
      if (data.userId === currentUser.id) return;
      editorStore.setUserCursor({
        userId:    data.userId,
        userName:  data.userName,
        color:     data.color,
        lineNumber: data.lineNumber,
        column:    data.column,
        // language is included so the editor can hide cursors from users
        // who are currently viewing a different language tab.
        language:  data.language,
        selection: data.selection,
      });
    };

    // Guide cursor: teleport THIS user's Monaco caret to the requested line
    const handleGuideCursor = (data: any) => {
      // Only apply if this message is addressed to the current user
      if (data.targetUserId !== currentUser.id) return;

      const ed = useEditorStore.getState().editor;
      if (ed) {
        ed.setPosition({ lineNumber: data.lineNumber, column: data.column });
        // 1 = ScrollType.Smooth — centers the target line in the viewport
        ed.revealLineInCenter(data.lineNumber, 1);
        ed.focus();
      }

      // Show the named toast so the user knows who guided them and where
      useEditorStore.getState().setGuideCursorToast({
        fromUserName:  data.fromUserName,
        fromUserColor: data.fromUserColor,
        lineNumber:    data.lineNumber,
      });
    };

    // Register all handlers
    websocketService.on('users_list',    handleUsersList);
    websocketService.on('user_joined',   handleUserJoined);
    websocketService.on('user_left',     handleUserLeft);
    websocketService.on('code_change',   handleCodeChange);
    websocketService.on('chat_message',  handleChatMessage);
    websocketService.on('language_change', handleLanguageChange);
    websocketService.on('cursor_move',   handleCursorMove);
    websocketService.on('guide_cursor',  handleGuideCursor);

    websocketService.connect(currentUser);
    editorStore.setIsConnected(true);

    // ── Connection stability sync ──────────────────────────────────────────
    // After the WebSocket opens there is a brief window where in-flight
    // messages (e.g. a simultaneous user join) can race with the initial
    // users_list broadcast. Two seconds after connecting — once the
    // connection is stable — we request a fresh authoritative users list.
    // This is a one-shot request, not polling. The basis is connection
    // stability (a fixed, bounded post-handshake window), not user count.
    const syncTimer = setTimeout(() => {
      if (websocketService.isConnected()) {
        websocketService.sendRequestUsers();
      }
    }, 2000);

    return () => {
      clearTimeout(syncTimer);

      websocketService.off('users_list',    handleUsersList);
      websocketService.off('user_joined',   handleUserJoined);
      websocketService.off('user_left',     handleUserLeft);
      websocketService.off('code_change',   handleCodeChange);
      websocketService.off('chat_message',  handleChatMessage);
      websocketService.off('language_change', handleLanguageChange);
      websocketService.off('cursor_move',   handleCursorMove);
      websocketService.off('guide_cursor',  handleGuideCursor);

      chatStore.clearMessages();
      editorStore.clearUserCursors();
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

      {/* ── Guide-cursor toast ─────────────────────────────────────────── */}
      {guideCursorToast && (
        <div
          className="guide-toast"
          style={{ borderLeftColor: guideCursorToast.fromUserColor }}
          role="status"
          aria-live="polite"
        >
          {/* Crosshair icon */}
          <svg className="guide-toast__icon" viewBox="0 0 16 16" fill="none"
               stroke={guideCursorToast.fromUserColor} strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="4" />
            <line x1="8" y1="12" x2="8" y2="15" />
            <line x1="1" y1="8" x2="4" y2="8" />
            <line x1="12" y1="8" x2="15" y2="8" />
          </svg>
          <span className="guide-toast__text">
            <strong style={{ color: guideCursorToast.fromUserColor }}>
              {guideCursorToast.fromUserName}
            </strong>
            {' '}guided you to{' '}
            <strong>line {guideCursorToast.lineNumber}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
