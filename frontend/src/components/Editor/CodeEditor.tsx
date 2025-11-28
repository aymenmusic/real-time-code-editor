import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEditorStore } from '../../store/editorStore';
import { websocketService } from '../../services/websocketService';

interface CodeEditorProps {
  language?: string;
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  language = 'python',  // Default to Python
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { code, updateCode, setEditor, language: storeLanguage } = useEditorStore();
  const [isLocalChange, setIsLocalChange] = useState(false);

  const handleEditorDidMount: OnMount = (editor) => {
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

  // Debounced WebSocket send - only send code changes after user stops typing
  useEffect(() => {
    if (!isLocalChange) {
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
  }, [code, isLocalChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        setEditor(null);
      }
    };
  }, [setEditor]);

  return (
    <div className="code-editor-container">
      <Editor
        height="100%"
        width="100%"
        language={storeLanguage}  // Use language from store
        theme={theme}
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
