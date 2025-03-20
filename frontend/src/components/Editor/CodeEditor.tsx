import { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEditorStore } from '../../store/editorStore';

interface CodeEditorProps {
  language?: string;
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  language = 'javascript',
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { code, updateCode, setEditor } = useEditorStore();

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setEditor(editor);
    
    // Focus the editor when it mounts
    editor.focus();
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      updateCode(value);
    }
  };

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
        language={language}
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
        }}
      />
    </div>
  );
};

export default CodeEditor;
