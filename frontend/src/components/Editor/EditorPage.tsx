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

const EditorPage = () => {
  const { isDarkMode } = useThemeStore();

  // Get authentication state
  const { isAuthenticated, user } = useAuthStore();
  
  // Add the current user to the users list
  useEffect(() => {
    console.log('Managing user presence...');
    
    const editorStore = useEditorStore.getState();
    
    // Clear existing users first
    editorStore.setUsers([]);
    
    if (isAuthenticated && user) {
      // Generate a random color for the user
      const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF6', '#F6FF33'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Add the authenticated user
      const currentUser = {
        id: user.id.toString(),
        name: user.username,
        color: randomColor
      };
      
      editorStore.addUser(currentUser);
      console.log(`Added authenticated user: ${currentUser.name}`);
    } else {
      // No users to add when not authenticated
      console.log('No authenticated user to add');
    }
    
    // Set connection status based on authentication
    editorStore.setIsConnected(isAuthenticated);
    
    // Cleanup function
    return () => {
      console.log('Cleaning up user presence...');
      editorStore.setIsConnected(false);
    };
  }, [isAuthenticated, user]); // Re-run when authentication state changes
  
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
