import { create } from 'zustand';

interface ExecutionState {
  isExecuting: boolean;
  output: string[];
  errors: string[];
  clearOutput: () => void;
  addOutput: (line: string) => void;
  addError: (error: string) => void;
  setErrors: (errors: string[]) => void;
  setIsExecuting: (isExecuting: boolean) => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  isExecuting: false,
  output: [],
  errors: [],
  
  clearOutput: () => set({ output: [], errors: [] }),
  
  addOutput: (line) => 
    set((state) => ({
      output: [...state.output, line]
    })),
  
  addError: (error) => 
    set((state) => ({
      errors: [...state.errors, error]
    })),
  
  setErrors: (errors) => set({ errors }),
  
  setIsExecuting: (isExecuting) => set({ isExecuting }),
}));

// Connect to our FastAPI backend to execute code
export const executeCode = async (code: string, language: string): Promise<void> => {
  const executionStore = useExecutionStore.getState();
  
  executionStore.clearOutput();
  executionStore.setIsExecuting(true);
  
  try {
    // Get the auth token from localStorage
    const authStorage = localStorage.getItem('auth-storage');
    const token = authStorage ? JSON.parse(authStorage).state.token : null;
    
    // Send the code to our backend for execution
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        code,
        language,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      executionStore.setErrors([`Error: ${result.detail || 'Failed to execute code'}`]);
      return;
    }
    
    // Process the response
    if (result.success) {
        // Split stdout by newlines and add each line to the output
      if (result.stdout) {
        const outputLines = result.stdout.split('\n');
        // Filter out empty lines at the end
        const filteredLines = outputLines.filter((line: string) => line !== '');
        filteredLines.forEach((line: string) => executionStore.addOutput(line));
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        executionStore.addOutput('Program executed successfully (no output generated).');
      } else {
        executionStore.addOutput('Program executed successfully.');
      }
    } else {
      // Handle execution errors
      if (result.stderr) {
        const errorLines = result.stderr.split('\n');
        const filteredErrors = errorLines.filter((line: string) => line !== '');
        executionStore.setErrors(filteredErrors);
      } else {
        executionStore.setErrors([`Error: Exit code ${result.exit_code}`]);
      }
    }
  } catch (err) {
    executionStore.addError(err instanceof Error 
      ? `Error: ${err.message}` 
      : 'An unknown error occurred while connecting to the backend');
  } finally {
    executionStore.setIsExecuting(false);
  }
};
