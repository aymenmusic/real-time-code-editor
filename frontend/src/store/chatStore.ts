import { create } from 'zustand';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  
  addMessage: (messageData) => 
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          ...messageData,
          timestamp: Date.now(),
        },
      ].slice(-100), // Keep only the last 100 messages
    })),
  
  clearMessages: () => set({ messages: [] }),
}));
