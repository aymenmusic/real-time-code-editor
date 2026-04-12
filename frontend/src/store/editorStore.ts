import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { editor } from 'monaco-editor';

export interface User {
  id: string;
  name: string;
  color: string;
}

// Map of language -> code content
type CodeByLanguage = {
  [language: string]: string;
};

interface EditorState {
  code: string;
  language: string;
  codeByLanguage: CodeByLanguage; // NEW: Store code for each language separately
  editor: editor.IStandaloneCodeEditor | null;
  isConnected: boolean;
  users: User[];
  updateCode: (newCode: string) => void;
  setLanguage: (language: string) => void;
  setEditor: (editor: editor.IStandaloneCodeEditor | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
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
        
        console.log(`Switching from ${state.language} to ${newLanguage}`);
        console.log(`Saved code for ${state.language}:`, state.code.substring(0, 50) + '...');
        console.log(`Loading code for ${newLanguage}:`, newCode.substring(0, 50) + '...');
        
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
          users: state.users.filter(user => user.id !== userId)
        })),
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
          
          console.log(`Restored editor state for ${currentLanguage}`);
        }
      },
    }
  )
);
