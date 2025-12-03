import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { websocketService } from '../../services/websocketService';
import { getBuiltinSuggestions } from '../../utils/autocompleteSuggestions';

interface CodeEditorProps {
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
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
    
    // Register autocomplete provider for built-in functions
    // This works for Python, JavaScript, and TypeScript
    const languages = ['python', 'javascript', 'typescript'];
    
    languages.forEach((lang) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const builtins = getBuiltinSuggestions(lang);
          const word = model.getWordUntilPosition(position);
          const wordText = word.word.toLowerCase();
          
          // Only provide built-in suggestions if user has typed something
          // and filter to match what they're typing
          const filteredBuiltins = wordText.length > 0 
            ? builtins.filter(item => item.label.toLowerCase().startsWith(wordText))
            : builtins;
          
          const suggestions = filteredBuiltins.map((item) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.label,
            // Use 'z_' prefix to give built-ins lower priority (sorted alphabetically)
            // User-defined functions will appear first, then built-ins
            sortText: `z_${item.label}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            },
          }));
          
          // Return suggestions without setting 'incomplete' flag
          // This allows Monaco's default providers to also contribute
          return { 
            suggestions,
            incomplete: false
          };
        },
      });
    });
    
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
          // Enable IntelliSense and autocomplete features
          'semanticHighlighting.enabled': true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'allDocuments',  // Enable word-based suggestions from all documents
          suggest: {
            showWords: true,
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showMethods: true,
            showProperties: true,
            showValues: true,
            showConstants: true,
            insertMode: 'insert',
          },
          // Enable parameter hints
          parameterHints: {
            enabled: true,
            cycle: true,
          },
          // Show suggestions automatically
          suggestSelection: 'first',
          // Most importantly - disable the DOM-based spell checker
          domReadOnly: undefined,
          ariaLabel: 'Code Editor',
        }}
      />
    </div>
  );
};

export default CodeEditor;
