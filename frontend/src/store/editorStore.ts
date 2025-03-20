import { create } from 'zustand';
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

export const useEditorStore = create<EditorState>((set) => ({
  code: '# Start coding here\n\ndef hello_world():\n    print("Hello, world!")\n\nhello_world()',
  language: 'python',
  editor: null,
  isConnected: false,
  users: [],
  
  updateCode: (newCode) => set({ code: newCode }),
  
  setLanguage: (language) => set({ language }),
  
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
}));
