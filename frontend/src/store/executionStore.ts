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
    // Send the code to our backend for execution
    const response = await fetch('http://localhost:8000/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

// Check for Python runtime errors (simplified simulation)
const checkPythonRuntimeErrors = (code: string): string[] => {
  const errors: string[] = [];
  const lines = code.split('\n');
  
  // Check for division by zero
  lines.forEach((line, index) => {
    if (line.includes('/0') || line.includes('/ 0')) {
      errors.push(`ZeroDivisionError at line ${index + 1}: division by zero`);
    }
  });
  
  // Check for index out of range
  if (code.includes('[') && code.includes(']')) {
    const listDefMatch = code.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\[(.*?)\]/);
    if (listDefMatch) {
      const listName = listDefMatch[1];
      const listItems = listDefMatch[2].split(',').length;
      
      // Check for accessing an index beyond the list length
      const indexAccessRegex = new RegExp(`${listName}\\s*\\[\\s*(\\d+)\\s*\\]`);
      const indexMatch = code.match(indexAccessRegex);
      if (indexMatch && parseInt(indexMatch[1]) >= listItems) {
        errors.push(`IndexError: list index out of range`);
      }
    }
  }
  
  // Check for using undefined variables (simplified)
  const definedVars = new Set<string>();
  const usedVars = new Set<string>();
  
  // First pass: collect defined variables
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) return;
    
    // Simple variable assignment
    const assignMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    if (assignMatch) {
      definedVars.add(assignMatch[1]);
    }
  });
  
  // Second pass: check for used but undefined variables
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) return;
    
    // Skip variable definitions
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(trimmedLine)) return;
    
    // Skip string literals - we need to remove them before checking for variables
    // This is a simplified approach and doesn't handle all cases
    let processedLine = trimmedLine;
    
    // Remove string literals (both single and double quotes)
    processedLine = processedLine.replace(/'[^']*'/g, "''");
    processedLine = processedLine.replace(/"[^"]*"/g, '""');
    
    // Extract all potential variable names from the processed line
    const words = processedLine.split(/[^a-zA-Z0-9_]/);
    words.forEach(word => {
      // Skip keywords, numbers, and empty strings
      if (!word || /^[0-9]/.test(word) || isPythonKeyword(word)) return;
      
      // Skip function calls
      if (processedLine.includes(word + '(')) return;
      
      // Skip common Python methods
      if (['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'].includes(word)) return;
      
      if (!definedVars.has(word) && !isPythonBuiltin(word)) {
        errors.push(`NameError at line ${index + 1}: name '${word}' is not defined`);
      }
    });
  });
  
  return errors;
};

// More comprehensive Python syntax checking
// This is still a simplified version - in a real app, this would be done on the backend
const checkPythonSyntax = (code: string): string[] => {
  const errors: string[] = [];
  const lines = code.split('\n');
  
  try {
    // Check for common syntax errors
    
    // 1. Check for mismatched parentheses, brackets, and braces
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`SyntaxError: Mismatched parentheses (${openParens} opening, ${closeParens} closing)`);
    }
    
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`SyntaxError: Mismatched brackets (${openBrackets} opening, ${closeBrackets} closing)`);
    }
    
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`SyntaxError: Mismatched braces (${openBraces} opening, ${closeBraces} closing)`);
    }
    
    // 2. Check for mismatched quotes
    // This is a simplified check and doesn't account for escaped quotes
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      errors.push("SyntaxError: Unclosed string (single quotes)");
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push("SyntaxError: Unclosed string (double quotes)");
    }
    
    // 3. Line-by-line checks
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        return;
      }
      
      // Check for print without parentheses (Python 3 requires parentheses)
      if (trimmedLine.startsWith('print ') && !trimmedLine.includes('(')) {
        errors.push(`SyntaxError at line ${lineNum}: Missing parentheses in call to 'print'`);
      }
      
      // Check for unbalanced parentheses in a single line
      const lineOpenParens = (line.match(/\(/g) || []).length;
      const lineCloseParens = (line.match(/\)/g) || []).length;
      if (lineOpenParens !== lineCloseParens) {
        errors.push(`SyntaxError at line ${lineNum}: Unbalanced parentheses`);
      }
      
      // Check for invalid indentation (simplified)
      if (trimmedLine && line.startsWith(' ') && !line.startsWith('    ') && !line.startsWith('\t')) {
        errors.push(`IndentationError at line ${lineNum}: Unexpected indentation`);
      }
      
      // Check for colon at the end of function/class/if/for/while definitions
      if (/^\s*(def|class|if|for|while|else|elif|try|except|finally)\b.*\S\s*$/.test(line) && !trimmedLine.endsWith(':')) {
        errors.push(`SyntaxError at line ${lineNum}: Expected ':' at the end of the statement`);
      }
      
      // Check for invalid variable names
      if (/^\s*[0-9]+[a-zA-Z_]+ *=/.test(line)) {
        errors.push(`SyntaxError at line ${lineNum}: Invalid variable name (cannot start with a number)`);
      }
      
      // Check for invalid assignment (but not simple variable assignments like x = 5)
      if (/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[^=!<>]=[^=]/.test(line) && 
          !/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[a-zA-Z0-9_"'[\]{}().]+/.test(line)) {
        errors.push(`SyntaxError at line ${lineNum}: Invalid assignment`);
      }
      
      // Check for invalid comparison (= instead of ==)
      if (/\s+if\s+[^=!<>]+=[^=]+:/.test(line)) {
        errors.push(`SyntaxError at line ${lineNum}: Invalid comparison (use == instead of =)`);
      }
    });
    
    // 4. Check for undefined variables (simplified)
    const definedVars = new Set<string>();
    const usedVars = new Set<string>();
    
    // First pass: collect defined variables
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '' || trimmedLine.startsWith('#')) return;
      
      // Simple variable assignment
      const assignMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
      if (assignMatch) {
        definedVars.add(assignMatch[1]);
      }
      
      // Function definition
      const funcMatch = trimmedLine.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (funcMatch) {
        definedVars.add(funcMatch[1]);
      }
    });
    
  // Second pass: check for used but undefined variables
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) return;
    
    // Skip variable definitions
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(trimmedLine)) return;
    
    // Skip string literals - we need to remove them before checking for variables
    let processedLine = trimmedLine;
    
    // Remove string literals (both single and double quotes)
    processedLine = processedLine.replace(/'[^']*'/g, "''");
    processedLine = processedLine.replace(/"[^"]*"/g, '""');
    
    // Extract all potential variable names from the processed line
    const words = processedLine.split(/[^a-zA-Z0-9_]/);
    words.forEach(word => {
      // Skip keywords, numbers, and empty strings
      if (!word || /^[0-9]/.test(word) || isPythonKeyword(word)) return;
      
      // Skip function calls
      if (processedLine.includes(word + '(')) return;
      
      // Skip common Python methods
      if (['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'].includes(word)) return;
      
      usedVars.add(word);
    });
  });
    
    // Check for undefined variables
    usedVars.forEach(variable => {
      if (!definedVars.has(variable) && !isPythonBuiltin(variable)) {
        errors.push(`NameError: name '${variable}' is not defined`);
      }
    });
    
    // 5. Check for invalid syntax in common Python constructs
    // This is very simplified and would be much more complex in a real implementation
    
    // Check for invalid for loop syntax
    const forLoops = lines.filter(line => line.trim().startsWith('for '));
    forLoops.forEach((line, index) => {
      if (!line.includes(' in ')) {
        errors.push(`SyntaxError at line ${lines.indexOf(line) + 1}: Invalid for loop syntax (missing 'in' keyword)`);
      }
    });
    
  } catch (e) {
    // If our syntax checker itself throws an error, add a generic syntax error
    errors.push("SyntaxError: Invalid syntax");
  }
  
  return errors;
};

// Helper functions for syntax checking
const isPythonKeyword = (word: string): boolean => {
  const keywords = [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ];
  return keywords.includes(word);
};

const isPythonBuiltin = (word: string): boolean => {
  const builtins = [
    'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr',
    'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 
    'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 
    'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 
    'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 
    'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 
    'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 
    'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 
    'vars', 'zip'
  ];
  return builtins.includes(word);
};
