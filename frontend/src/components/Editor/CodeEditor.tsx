import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange, loader } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { websocketService } from '../../services/websocketService';

interface CodeEditorProps {
  language?: string;
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  language = 'python',  // Default to Python
  theme,  // Will use theme from store
  readOnly = false,
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { code, updateCode, setEditor, language: storeLanguage } = useEditorStore();
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [isLocalChange, setIsLocalChange] = useState(false);

  // Use dark theme when isDarkMode is true, light theme otherwise
  const editorTheme = theme || (isDarkMode ? 'dark-blue' : 'vs');
 
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Define custom dark blue theme BEFORE setting the editor
    monaco.editor.defineTheme('dark-blue', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a2332',
        'editor.foreground': '#e0e6ed',
        'editorLineNumber.foreground': '#5a7299',
        'editor.selectionBackground': '#394C8B',
        'editor.inactiveSelectionBackground': '#2d3e5a',
        'editorCursor.foreground': '#60a5fa',
        'editor.lineHighlightBackground': '#1e2a3d',
        // 🔥 THIS FIXES THE WHITE LINE
        'editorGroup.border': '#1A2531',


      }
    });
    
    // Set the theme if in dark mode
    if (isDarkMode) {
      monaco.editor.setTheme('dark-blue');
    }
    
    editorRef.current = editor;
    setEditor(editor);
    
    // Focus the editor when it mounts
    editor.focus();
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setIsLocalChange(true);
      updateCode(value);
    }
  };

  // Debounced WebSocket send - only send if authenticated
  useEffect(() => {
    if (!isLocalChange || !isAuthenticated) {
      setIsLocalChange(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (websocketService.isConnected()) {
        websocketService.sendCodeChange(code);
        console.log('Sent code change via WebSocket');
      }
      setIsLocalChange(false);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [code, isLocalChange, isAuthenticated]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        setEditor(null);
      }
    };
  }, [setEditor]);

  // Update theme when dark mode changes
  useEffect(() => {
    if (editorRef.current) {
      const newTheme = isDarkMode ? 'dark-blue' : 'vs';
      monaco.editor.setTheme(newTheme);
    }
  }, [isDarkMode]);

  return (
    <div className="code-editor-container">
      <Editor
        height="100%"
        width="100%"
        language={storeLanguage}  // Use language from store
        theme={editorTheme}  // Use theme based on dark mode toggle
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 2,
          automaticLayout: true,
          wordWrap: 'on',
          // Disable spell checking - this prevents browser spell-check underlines
          'semanticHighlighting.enabled': true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'off',  // Disable word-based suggestions
          // Most importantly - disable the DOM-based spell checker
          domReadOnly: undefined,
          ariaLabel: 'Code Editor',
        }}
      />
    </div>
  );
};

export default CodeEditor;
