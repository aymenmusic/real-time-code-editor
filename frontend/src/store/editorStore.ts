import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { editor } from 'monaco-editor';

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface UserCursor {
  userId: string;
  userName: string;
  color: string;
  lineNumber: number;
  column: number;
  /** Present only when the user has an active non-empty selection */
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

// Map of language -> code content
type CodeByLanguage = {
  [language: string]: string;
};

interface EditorState {
  code: string;
  language: string;
  codeByLanguage: CodeByLanguage;
  editor: editor.IStandaloneCodeEditor | null;
  isConnected: boolean;
  users: User[];
  /** Live cursor positions of all REMOTE users (keyed by userId). */
  userCursors: Record<string, UserCursor>;
  updateCode: (newCode: string) => void;
  setLanguage: (language: string) => void;
  setEditor: (editor: editor.IStandaloneCodeEditor | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setUserCursor: (cursor: UserCursor) => void;
  removeUserCursor: (userId: string) => void;
  clearUserCursors: () => void;
}

// Default code templates for each language
const getDefaultCode = (language: string): string => {
  switch (language) {
    case 'python':
      return '# Start coding here\n\ndef hello_world():\n    print("Hello, world!")\n\nhello_world()';
    case 'javascript':
      return '// Start coding here\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();';
    default:
      return '// Start coding here';
  }
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      code: getDefaultCode('python'),
      language: 'python',
      codeByLanguage: {
        python: getDefaultCode('python'),
        javascript: getDefaultCode('javascript'),
      },
      editor: null,
      isConnected: false,
      users: [],
      
      updateCode: (newCode) => set((state) => ({
        code: newCode,
        // Also save to the language-specific storage
        codeByLanguage: {
          ...state.codeByLanguage,
          [state.language]: newCode,
        }
      })),
      
      setLanguage: (newLanguage) => set((state) => {
        // Save current code to the current language before switching
        const updatedCodeByLanguage = {
          ...state.codeByLanguage,
          [state.language]: state.code,
        };
        
        // Load code for the new language (or use default if not yet saved)
        const newCode = updatedCodeByLanguage[newLanguage] || getDefaultCode(newLanguage);
        
        return {
          language: newLanguage,
          code: newCode,
          codeByLanguage: updatedCodeByLanguage,
        };
      }),
      
      setEditor: (editor) => set({ editor }),
      
      setIsConnected: (isConnected) => set({ isConnected }),
      
      setUsers: (users) => set({ users }),
      
      addUser: (user) => 
        set((state) => ({
          users: [...state.users.filter(u => u.id !== user.id), user]
        })),
      
      removeUser: (userId) =>
        set((state) => ({
          users: state.users.filter(user => user.id !== userId),
        })),

      userCursors: {},

      setUserCursor: (cursor) =>
        set((state) => ({
          userCursors: { ...state.userCursors, [cursor.userId]: cursor },
        })),

      removeUserCursor: (userId) =>
        set((state) => {
          const next = { ...state.userCursors };
          delete next[userId];
          return { userCursors: next };
        }),

      clearUserCursors: () => set({ userCursors: {} }),
    }),
    {
      name: 'editor-storage', // localStorage key
      partialize: (state) => ({ 
        codeByLanguage: state.codeByLanguage, // Persist all language-specific code
        language: state.language 
      }), // Don't persist 'code' directly - it's derived from codeByLanguage
      onRehydrateStorage: () => (state) => {
        // After loading from localStorage, set the current code based on selected language
        if (state) {
          const currentLanguage = state.language || 'python';
          // Load code for current language, or use default if not found
          state.code = state.codeByLanguage?.[currentLanguage] || getDefaultCode(currentLanguage);
          
          // Ensure all languages have at least default code
          if (!state.codeByLanguage) {
            state.codeByLanguage = {
              python: getDefaultCode('python'),
              javascript: getDefaultCode('javascript'),
            };
          }
          
        }
      },
    }
  )
);
