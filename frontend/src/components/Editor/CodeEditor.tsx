import { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { useEditorStore, UserCursor } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { websocketService } from '../../services/websocketService';
import { getBuiltinSuggestions } from '../../utils/autocompleteSuggestions';

// ── Cursor decoration helpers (defined outside component for stability) ──────

/** Convert a hex color string to rgba() */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Make a CSS-safe class-name suffix from an arbitrary user ID */
const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');

// ─────────────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  theme?: string;
  readOnly?: boolean;
}

const CodeEditor = ({
  theme,
  readOnly = false,
}: CodeEditorProps) => {
  const editorRef     = useRef<editor.IStandaloneCodeEditor | null>(null);
  /** Decoration IDs returned by deltaDecorations(), keyed by remote userId */
  const decorationsRef = useRef<Map<string, string[]>>(new Map());
  /** Username label <div> elements appended to the editor DOM, keyed by remote userId */
  const labelsRef      = useRef<Map<string, HTMLElement>>(new Map());
  /** Throttle timer for cursor broadcasts */
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Stable snapshot of userCursors used inside scroll/event handlers (avoids stale closures) */
  const userCursorsSnapshotRef = useRef<Record<string, UserCursor>>({});

  const { code, updateCode, setEditor, language: storeLanguage } = useEditorStore();
  /** Subscribe to remote cursor updates — triggers re-render + decoration refresh */
  const userCursors = useEditorStore(state => state.userCursors);
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [isLocalChange, setIsLocalChange] = useState(false);

  // Keep a stable ref snapshot of userCursors for use in event callbacks
  useEffect(() => {
    userCursorsSnapshotRef.current = userCursors;
  }, [userCursors]);

  // ── Inject per-user CSS for cursor bars and selection highlights ────────────
  const injectCursorStyles = useCallback((cursors: Record<string, UserCursor>) => {
    let styleEl = document.getElementById('rc-styles') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'rc-styles';
      document.head.appendChild(styleEl);
    }
    const rules = Object.values(cursors).map(c => {
      const uid = sanitizeId(c.userId);
      const rgba = hexToRgba(c.color, 0.18);
      return `
        .rc-after-${uid}::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0; right: -1px;
          width: 2px;
          background: ${c.color};
          pointer-events: none;
          z-index: 10;
        }
        .rc-before-${uid}::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 2px;
          background: ${c.color};
          pointer-events: none;
          z-index: 10;
        }
        .rc-sel-${uid} {
          background-color: ${rgba};
          border-radius: 1px;
        }
      `;
    }).join('\n');
    styleEl.textContent = rules;
  }, []);

  // ── Create/update the floating username label for a remote cursor ────────────
  const updateLabel = useCallback((cursor: UserCursor) => {
    const ed = editorRef.current;
    if (!ed) return;
    const dom = ed.getDomNode();
    if (!dom) return;

    let label = labelsRef.current.get(cursor.userId);
    if (!label) {
      label = document.createElement('div');
      label.className = 'rc-label';
      Object.assign(label.style, {
        position:        'absolute',
        zIndex:          '100',
        pointerEvents:   'none',
        userSelect:      'none',
        backgroundColor: cursor.color,
        color:           'white',
        fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize:        '11px',
        fontWeight:      '600',
        padding:         '1px 6px',
        borderRadius:    '3px 3px 3px 0',
        whiteSpace:      'nowrap',
        lineHeight:      '16px',
        // Subtle slide when cursor moves
        transition:      'top 0.06s ease, left 0.06s ease',
      });
      label.textContent = cursor.userName;
      dom.appendChild(label);
      labelsRef.current.set(cursor.userId, label);
    }

    // getScrolledVisiblePosition returns position relative to the editor's
    // visible area, accounting for scroll. Returns null if scrolled off-screen.
    const pos = ed.getScrolledVisiblePosition({
      lineNumber: cursor.lineNumber,
      column: cursor.column,
    });
    if (pos) {
      label.style.top     = `${pos.top - 18}px`;
      label.style.left    = `${pos.left}px`;
      label.style.display = 'block';
    } else {
      label.style.display = 'none';
    }
  }, []);

  // ── Apply / refresh Monaco decorations whenever userCursors changes ──────────
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const model = ed.getModel();
    if (!model) return;

    // Regenerate CSS classes for the current set of remote users
    injectCursorStyles(userCursors);

    // Remove decorations + labels for users who are no longer present
    decorationsRef.current.forEach((ids, userId) => {
      if (!userCursors[userId]) {
        ed.deltaDecorations(ids, []);
        decorationsRef.current.delete(userId);
        const lbl = labelsRef.current.get(userId);
        if (lbl) { lbl.remove(); labelsRef.current.delete(userId); }
      }
    });

    // Upsert decorations for each active remote cursor
    Object.values(userCursors).forEach(cursor => {
      const uid = sanitizeId(cursor.userId);
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      // Clamp to valid model range
      const maxLine = model.getLineCount();
      const safeLine = Math.min(Math.max(1, cursor.lineNumber), maxLine);
      const maxCol   = model.getLineMaxColumn(safeLine);

      // Cursor bar — thin 2px vertical line rendered via ::after / ::before
      if (cursor.column > 1) {
        decorations.push({
          range: new monaco.Range(
            safeLine, Math.min(cursor.column - 1, maxCol),
            safeLine, Math.min(cursor.column,     maxCol),
          ),
          options: {
            afterContentClassName: `rc-after-${uid}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      } else {
        // Column 1 — use ::before on the first character
        decorations.push({
          range: new monaco.Range(safeLine, 1, safeLine, Math.min(2, maxCol)),
          options: {
            beforeContentClassName: `rc-before-${uid}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }

      // Selection highlight (only when the user has an actual non-empty selection)
      const sel = cursor.selection;
      if (sel) {
        const isEmpty =
          sel.startLineNumber === sel.endLineNumber &&
          sel.startColumn === sel.endColumn;
        if (!isEmpty) {
          decorations.push({
            range: new monaco.Range(
              sel.startLineNumber, sel.startColumn,
              sel.endLineNumber,   sel.endColumn,
            ),
            options: {
              className: `rc-sel-${uid}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      const oldIds = decorationsRef.current.get(cursor.userId) || [];
      const newIds = ed.deltaDecorations(oldIds, decorations);
      decorationsRef.current.set(cursor.userId, newIds);

      // Reposition (or create) the username label
      updateLabel(cursor);
    });
  }, [userCursors, injectCursorStyles, updateLabel]);

  // ── Monaco editor mount ──────────────────────────────────────────────────────
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Define custom dark-blue theme
    monaco.editor.defineTheme('dark-blue', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background':                '#1a2332',
        'editor.foreground':                '#e0e6ed',
        'editorLineNumber.foreground':      '#5a7299',
        'editor.selectionBackground':       '#394C8B',
        'editor.inactiveSelectionBackground': '#2d3e5a',
        'editorCursor.foreground':          '#60a5fa',
        'editor.lineHighlightBackground':   '#1e2a3d',
        'editorGroup.border':               '#1A2531',
      },
    });

    if (isDarkMode) {
      monaco.editor.setTheme('dark-blue');
    }

    // Register autocomplete providers for built-in functions
    const languages = ['python', 'javascript', 'typescript'];
    languages.forEach((lang) => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: (model, position) => {
          const builtins = getBuiltinSuggestions(lang);
          const word = model.getWordUntilPosition(position);
          const wordText = word.word.toLowerCase();
          const filteredBuiltins = wordText.length > 0
            ? builtins.filter(item => item.label.toLowerCase().startsWith(wordText))
            : builtins;
          const suggestions = filteredBuiltins.map((item) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.label,
            sortText: `z_${item.label}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber:   position.lineNumber,
              startColumn:     word.startColumn,
              endColumn:       word.endColumn,
            },
          }));
          return { suggestions, incomplete: false };
        },
      });
    });

    editorRef.current = editor;
    setEditor(editor);
    editor.focus();

    // ── Broadcast cursor position to collaborators (throttled to 80 ms) ────────
    editor.onDidChangeCursorPosition((e) => {
      if (!isAuthenticated || !websocketService.isConnected()) return;
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current);
      cursorThrottleRef.current = setTimeout(() => {
        const selection = editor.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        websocketService.sendCursorMove({
          lineNumber: e.position.lineNumber,
          column:     e.position.column,
          selection:  hasSelection && selection ? {
            startLineNumber: selection.startLineNumber,
            startColumn:     selection.startColumn,
            endLineNumber:   selection.endLineNumber,
            endColumn:       selection.endColumn,
          } : undefined,
        });
      }, 80);
    });

    // ── Reposition username labels whenever the editor is scrolled ─────────────
    editor.onDidScrollChange(() => {
      Object.values(userCursorsSnapshotRef.current).forEach(cursor => {
        const lbl = labelsRef.current.get(cursor.userId);
        if (!lbl) return;
        const pos = editor.getScrolledVisiblePosition({
          lineNumber: cursor.lineNumber,
          column:     cursor.column,
        });
        if (pos) {
          lbl.style.top     = `${pos.top - 18}px`;
          lbl.style.left    = `${pos.left}px`;
          lbl.style.display = 'block';
        } else {
          lbl.style.display = 'none';
        }
      });
    });
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setIsLocalChange(true);
      updateCode(value);
    }
  };

  // ── Debounced WebSocket code-change send ─────────────────────────────────────
  useEffect(() => {
    if (!isLocalChange || !isAuthenticated) {
      setIsLocalChange(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      if (websocketService.isConnected()) {
        websocketService.sendCodeChange(code);
      }
      setIsLocalChange(false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [code, isLocalChange, isAuthenticated]);

  // ── Theme sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(isDarkMode ? 'dark-blue' : 'vs');
    }
  }, [isDarkMode]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Remove injected cursor style element
      document.getElementById('rc-styles')?.remove();
      // Remove all label DOM nodes
      labelsRef.current.forEach(lbl => lbl.remove());
      labelsRef.current.clear();
      decorationsRef.current.clear();
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current);
      if (editorRef.current) setEditor(null);
    };
  }, [setEditor]);

  const editorTheme = theme || (isDarkMode ? 'dark-blue' : 'vs');

  return (
    <div className="code-editor-container">
      <Editor
        height="100%"
        width="100%"
        language={storeLanguage}
        theme={editorTheme}
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
          'semanticHighlighting.enabled': true,
          quickSuggestions: { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          wordBasedSuggestions: 'allDocuments',
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
          parameterHints: { enabled: true, cycle: true },
          suggestSelection: 'first',
          domReadOnly: undefined,
          ariaLabel: 'Code Editor',
        }}
      />
    </div>
  );
};

export default CodeEditor;
