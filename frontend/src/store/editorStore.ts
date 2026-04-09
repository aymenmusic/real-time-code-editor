import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { editor } from 'monaco-editor';

export interface User {
  id: string;
  name: string;
  color: string;
}

interface EditorState {
  code: string;
  language: string;
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

// Helper function to check if code is a default template
const isDefaultTemplate = (code: string, language: string): boolean => {
  const trimmedCode = code.trim();
  const defaultCode = getDefaultCode(language).trim();
  return trimmedCode === defaultCode;
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      code: getDefaultCode('python'),
      language: 'python',
      editor: null,
      isConnected: false,
      users: [],
      
      updateCode: (newCode) => set({ code: newCode }),
      
      setLanguage: (language) => set((state) => ({
        language,
        // Update code to default template if switching languages and current code is a default template
        code: isDefaultTemplate(state.code, state.language) 
          ? getDefaultCode(language) 
          : state.code
      })),
      
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
        code: state.code, 
        language: state.language 
      }), // Only persist code and language, not editor instance or connection state
      onRehydrateStorage: () => (state) => {
        // After loading from localStorage, ensure code matches the language
        if (state) {
          // Check if the current code is a default template for a DIFFERENT language
          // This can happen if user was using JavaScript but the code is Python boilerplate
          const isCodeForCurrentLanguage = isDefaultTemplate(state.code, state.language);
          const isCodeForOtherLanguage = !isCodeForCurrentLanguage && 
            (isDefaultTemplate(state.code, 'python') || isDefaultTemplate(state.code, 'javascript'));
          
          // If code is a default template for a different language, update it to match current language
          if (isCodeForOtherLanguage) {
            state.code = getDefaultCode(state.language);
            console.log(`Fixed language/code mismatch: updated code to ${state.language} template`);
          }
        }
      },
    }
  )
);
