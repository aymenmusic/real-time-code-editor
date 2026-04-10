import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from '../editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    localStorage.clear();
    useEditorStore.setState({
      code: '# Start coding here\n\ndef hello_world():\n    print("Hello, world!")\n\nhello_world()',
      language: 'python',
      editor: null,
      isConnected: false,
      users: [],
    });
  });

  describe('initialization', () => {
    it('should initialize with Python as default language', () => {
      const state = useEditorStore.getState();
      expect(state.language).toBe('python');
    });

    it('should initialize with Python boilerplate code', () => {
      const state = useEditorStore.getState();
      expect(state.code).toContain('def hello_world()');
      expect(state.code).toContain('print("Hello, world!")');
    });

    it('should initialize with empty users array', () => {
      const state = useEditorStore.getState();
      expect(state.users).toEqual([]);
    });

    it('should initialize with isConnected as false', () => {
      const state = useEditorStore.getState();
      expect(state.isConnected).toBe(false);
    });
  });

  describe('updateCode', () => {
    it('should update code when updateCode is called', () => {
      const newCode = 'print("test")';
      useEditorStore.getState().updateCode(newCode);
      expect(useEditorStore.getState().code).toBe(newCode);
    });
  });

  describe('setLanguage', () => {
    it('should update language from Python to JavaScript', () => {
      useEditorStore.getState().setLanguage('javascript');
      expect(useEditorStore.getState().language).toBe('javascript');
    });

    it('should update code to JavaScript template when switching from Python default', () => {
      // Start with Python default
      const initialState = useEditorStore.getState();
      expect(initialState.language).toBe('python');
      
      // Switch to JavaScript
      useEditorStore.getState().setLanguage('javascript');
      
      const newState = useEditorStore.getState();
      expect(newState.language).toBe('javascript');
      expect(newState.code).toContain('function helloWorld()');
      expect(newState.code).toContain('console.log("Hello, world!")');
    });

    it('should preserve custom code when switching languages', () => {
      const customCode = 'print("my custom code")';
      useEditorStore.getState().updateCode(customCode);
      
      // Switch to JavaScript
      useEditorStore.getState().setLanguage('javascript');
      
      // Code should remain the same since it's not a default template
      expect(useEditorStore.getState().code).toBe(customCode);
    });

    it('should update to Python template when switching to Python from JavaScript default', () => {
      // Set to JavaScript with default code
      useEditorStore.setState({
        language: 'javascript',
        code: '// Start coding here\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n\nhelloWorld();',
      });
      
      // Switch to Python
      useEditorStore.getState().setLanguage('python');
      
      const state = useEditorStore.getState();
      expect(state.language).toBe('python');
      expect(state.code).toContain('def hello_world()');
    });
  });

  describe('user management', () => {
    it('should add a user to the users array', () => {
      const user = { id: '1', name: 'John', color: '#354889' };
      useEditorStore.getState().addUser(user);
      
      const state = useEditorStore.getState();
      expect(state.users).toHaveLength(1);
      expect(state.users[0]).toEqual(user);
    });

    it('should replace user if same id is added again', () => {
      const user1 = { id: '1', name: 'John', color: '#354889' };
      const user2 = { id: '1', name: 'John Updated', color: '#9CC8EA' };
      
      useEditorStore.getState().addUser(user1);
      useEditorStore.getState().addUser(user2);
      
      const state = useEditorStore.getState();
      expect(state.users).toHaveLength(1);
      expect(state.users[0].name).toBe('John Updated');
      expect(state.users[0].color).toBe('#9CC8EA');
    });

    it('should add multiple users', () => {
      const user1 = { id: '1', name: 'John', color: '#354889' };
      const user2 = { id: '2', name: 'Jane', color: '#9CC8EA' };
      
      useEditorStore.getState().addUser(user1);
      useEditorStore.getState().addUser(user2);
      
      const state = useEditorStore.getState();
      expect(state.users).toHaveLength(2);
    });

    it('should remove a user by id', () => {
      const user1 = { id: '1', name: 'John', color: '#354889' };
      const user2 = { id: '2', name: 'Jane', color: '#9CC8EA' };
      
      useEditorStore.getState().addUser(user1);
      useEditorStore.getState().addUser(user2);
      useEditorStore.getState().removeUser('1');
      
      const state = useEditorStore.getState();
      expect(state.users).toHaveLength(1);
      expect(state.users[0].id).toBe('2');
    });

    it('should set entire users array', () => {
      const users = [
        { id: '1', name: 'John', color: '#354889' },
        { id: '2', name: 'Jane', color: '#9CC8EA' },
      ];
      
      useEditorStore.getState().setUsers(users);
      
      const state = useEditorStore.getState();
      expect(state.users).toEqual(users);
    });
  });

  describe('connection state', () => {
    it('should update connection state', () => {
      useEditorStore.getState().setIsConnected(true);
      expect(useEditorStore.getState().isConnected).toBe(true);
      
      useEditorStore.getState().setIsConnected(false);
      expect(useEditorStore.getState().isConnected).toBe(false);
    });
  });
});
