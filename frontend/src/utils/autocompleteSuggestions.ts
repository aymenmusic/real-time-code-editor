// Built-in function suggestions for different programming languages

export interface CompletionItem {
  label: string;
  detail: string;
  documentation: string;
}

// Python built-in functions
export const pythonBuiltins: CompletionItem[] = [
  // Type functions
  { label: 'isinstance', detail: 'isinstance(obj, classinfo)', documentation: 'Return True if object is an instance of classinfo' },
  { label: 'issubclass', detail: 'issubclass(class, classinfo)', documentation: 'Return True if class is a subclass of classinfo' },
  { label: 'type', detail: 'type(object)', documentation: 'Return the type of an object' },
  
  // Built-in types
  { label: 'str', detail: 'str(object="")', documentation: 'Return a string version of object' },
  { label: 'int', detail: 'int(x=0)', documentation: 'Convert a number or string to an integer' },
  { label: 'float', detail: 'float(x=0.0)', documentation: 'Convert a string or number to a floating point number' },
  { label: 'bool', detail: 'bool(x=False)', documentation: 'Convert a value to a Boolean' },
  { label: 'list', detail: 'list([iterable])', documentation: 'Create a new list' },
  { label: 'tuple', detail: 'tuple([iterable])', documentation: 'Create a new tuple' },
  { label: 'dict', detail: 'dict(**kwargs)', documentation: 'Create a new dictionary' },
  { label: 'set', detail: 'set([iterable])', documentation: 'Create a new set' },
  { label: 'frozenset', detail: 'frozenset([iterable])', documentation: 'Return an immutable frozenset object' },
  { label: 'bytes', detail: 'bytes([source])', documentation: 'Return a new bytes object' },
  { label: 'bytearray', detail: 'bytearray([source])', documentation: 'Return a new array of bytes' },
  
  // Common functions
  { label: 'print', detail: 'print(*objects, sep=" ", end="\\n")', documentation: 'Print objects to the text stream' },
  { label: 'input', detail: 'input(prompt="")', documentation: 'Read a string from standard input' },
  { label: 'len', detail: 'len(s)', documentation: 'Return the length of an object' },
  { label: 'range', detail: 'range(stop) or range(start, stop[, step])', documentation: 'Return an immutable sequence of numbers' },
  { label: 'enumerate', detail: 'enumerate(iterable, start=0)', documentation: 'Return an enumerate object' },
  { label: 'zip', detail: 'zip(*iterables)', documentation: 'Make an iterator that aggregates elements from each of the iterables' },
  { label: 'map', detail: 'map(function, iterable)', documentation: 'Apply function to every item of iterable' },
  { label: 'filter', detail: 'filter(function, iterable)', documentation: 'Construct iterator from elements which are true' },
  { label: 'sorted', detail: 'sorted(iterable, key=None, reverse=False)', documentation: 'Return a new sorted list' },
  { label: 'reversed', detail: 'reversed(seq)', documentation: 'Return a reverse iterator' },
  
  // Math functions
  { label: 'abs', detail: 'abs(x)', documentation: 'Return the absolute value of a number' },
  { label: 'round', detail: 'round(number, ndigits=None)', documentation: 'Round a number to a given precision' },
  { label: 'min', detail: 'min(iterable)', documentation: 'Return the smallest item' },
  { label: 'max', detail: 'max(iterable)', documentation: 'Return the largest item' },
  { label: 'sum', detail: 'sum(iterable, start=0)', documentation: 'Sum start and the items of an iterable' },
  { label: 'pow', detail: 'pow(base, exp, mod=None)', documentation: 'Return base to the power exp' },
  { label: 'divmod', detail: 'divmod(a, b)', documentation: 'Return quotient and remainder' },
  
  // Object functions
  { label: 'getattr', detail: 'getattr(object, name[, default])', documentation: 'Get a named attribute from an object' },
  { label: 'setattr', detail: 'setattr(object, name, value)', documentation: 'Set a named attribute on an object' },
  { label: 'hasattr', detail: 'hasattr(object, name)', documentation: 'Return whether the object has an attribute' },
  { label: 'delattr', detail: 'delattr(object, name)', documentation: 'Delete a named attribute from an object' },
  { label: 'dir', detail: 'dir([object])', documentation: 'Return list of names in current scope or object attributes' },
  { label: 'vars', detail: 'vars([object])', documentation: 'Return __dict__ attribute of an object' },
  { label: 'id', detail: 'id(object)', documentation: 'Return the identity of an object' },
  { label: 'hash', detail: 'hash(object)', documentation: 'Return the hash value of an object' },
  
  // File I/O
  { label: 'open', detail: 'open(file, mode="r")', documentation: 'Open file and return a file object' },
  
  // Iterator functions
  { label: 'iter', detail: 'iter(object)', documentation: 'Return an iterator object' },
  { label: 'next', detail: 'next(iterator[, default])', documentation: 'Retrieve the next item from the iterator' },
  { label: 'all', detail: 'all(iterable)', documentation: 'Return True if all elements are true' },
  { label: 'any', detail: 'any(iterable)', documentation: 'Return True if any element is true' },
  
  // String functions
  { label: 'chr', detail: 'chr(i)', documentation: 'Return string of one character with ordinal i' },
  { label: 'ord', detail: 'ord(c)', documentation: 'Return integer ordinal of a character' },
  { label: 'ascii', detail: 'ascii(object)', documentation: 'Return printable representation with escapes' },
  { label: 'repr', detail: 'repr(object)', documentation: 'Return printable representation of object' },
  { label: 'format', detail: 'format(value, format_spec="")', documentation: 'Format a value' },
  
  // Other useful functions
  { label: 'eval', detail: 'eval(expression)', documentation: 'Evaluate a Python expression' },
  { label: 'exec', detail: 'exec(object)', documentation: 'Execute Python code dynamically' },
  { label: 'compile', detail: 'compile(source, filename, mode)', documentation: 'Compile source into code object' },
  { label: 'globals', detail: 'globals()', documentation: 'Return dictionary of current global symbol table' },
  { label: 'locals', detail: 'locals()', documentation: 'Return dictionary of current local symbol table' },
  { label: 'callable', detail: 'callable(object)', documentation: 'Return whether object is callable' },
  { label: 'classmethod', detail: '@classmethod', documentation: 'Transform method into a class method' },
  { label: 'staticmethod', detail: '@staticmethod', documentation: 'Transform method into a static method' },
  { label: 'property', detail: '@property', documentation: 'Return a property attribute' },
  { label: 'super', detail: 'super([type[, object-or-type]])', documentation: 'Return proxy object that delegates method calls to parent' },
  { label: 'help', detail: 'help([object])', documentation: 'Invoke the built-in help system' },
  { label: 'object', detail: 'object()', documentation: 'Return a new featureless object' },
  { label: 'slice', detail: 'slice(stop) or slice(start, stop[, step])', documentation: 'Return a slice object' },
  { label: 'memoryview', detail: 'memoryview(obj)', documentation: 'Return memory view object' },
  { label: 'complex', detail: 'complex(real=0, imag=0)', documentation: 'Create a complex number' },
  { label: '__import__', detail: '__import__(name)', documentation: 'Import a module' },
];

// JavaScript built-in functions
export const javascriptBuiltins: CompletionItem[] = [
  // Console methods
  { label: 'console.log', detail: 'console.log(...args)', documentation: 'Output a message to the console' },
  { label: 'console.error', detail: 'console.error(...args)', documentation: 'Output an error message to the console' },
  { label: 'console.warn', detail: 'console.warn(...args)', documentation: 'Output a warning message to the console' },
  { label: 'console.info', detail: 'console.info(...args)', documentation: 'Output an informational message' },
  { label: 'console.table', detail: 'console.table(data)', documentation: 'Display tabular data as a table' },
  { label: 'console.clear', detail: 'console.clear()', documentation: 'Clear the console' },
  
  // Type checking
  { label: 'typeof', detail: 'typeof value', documentation: 'Returns a string indicating the type of operand' },
  { label: 'instanceof', detail: 'object instanceof constructor', documentation: 'Tests whether object has constructor in prototype chain' },
  
  // Type conversion
  { label: 'parseInt', detail: 'parseInt(string, radix)', documentation: 'Parse a string and return an integer' },
  { label: 'parseFloat', detail: 'parseFloat(string)', documentation: 'Parse a string and return a floating point number' },
  { label: 'String', detail: 'String(value)', documentation: 'Convert value to a string' },
  { label: 'Number', detail: 'Number(value)', documentation: 'Convert value to a number' },
  { label: 'Boolean', detail: 'Boolean(value)', documentation: 'Convert value to a boolean' },
  
  // Array methods (static)
  { label: 'Array.isArray', detail: 'Array.isArray(value)', documentation: 'Check if value is an array' },
  { label: 'Array.from', detail: 'Array.from(arrayLike)', documentation: 'Create an array from an array-like object' },
  { label: 'Array.of', detail: 'Array.of(...elements)', documentation: 'Create an array from arguments' },
  
  // Object methods
  { label: 'Object.keys', detail: 'Object.keys(obj)', documentation: 'Returns array of object keys' },
  { label: 'Object.values', detail: 'Object.values(obj)', documentation: 'Returns array of object values' },
  { label: 'Object.entries', detail: 'Object.entries(obj)', documentation: 'Returns array of [key, value] pairs' },
  { label: 'Object.assign', detail: 'Object.assign(target, ...sources)', documentation: 'Copy values from sources to target' },
  { label: 'Object.create', detail: 'Object.create(proto)', documentation: 'Create object with specified prototype' },
  { label: 'Object.freeze', detail: 'Object.freeze(obj)', documentation: 'Freeze an object' },
  { label: 'Object.seal', detail: 'Object.seal(obj)', documentation: 'Seal an object' },
  
  // JSON
  { label: 'JSON.parse', detail: 'JSON.parse(text)', documentation: 'Parse JSON string' },
  { label: 'JSON.stringify', detail: 'JSON.stringify(value)', documentation: 'Convert value to JSON string' },
  
  // Math functions
  { label: 'Math.abs', detail: 'Math.abs(x)', documentation: 'Returns absolute value' },
  { label: 'Math.round', detail: 'Math.round(x)', documentation: 'Rounds to nearest integer' },
  { label: 'Math.floor', detail: 'Math.floor(x)', documentation: 'Rounds down to integer' },
  { label: 'Math.ceil', detail: 'Math.ceil(x)', documentation: 'Rounds up to integer' },
  { label: 'Math.max', detail: 'Math.max(...values)', documentation: 'Returns largest value' },
  { label: 'Math.min', detail: 'Math.min(...values)', documentation: 'Returns smallest value' },
  { label: 'Math.random', detail: 'Math.random()', documentation: 'Returns random number between 0 and 1' },
  { label: 'Math.sqrt', detail: 'Math.sqrt(x)', documentation: 'Returns square root' },
  { label: 'Math.pow', detail: 'Math.pow(base, exponent)', documentation: 'Returns base to the exponent power' },
  
  // Global functions
  { label: 'isNaN', detail: 'isNaN(value)', documentation: 'Check if value is NaN' },
  { label: 'isFinite', detail: 'isFinite(value)', documentation: 'Check if value is finite number' },
  { label: 'setTimeout', detail: 'setTimeout(callback, delay)', documentation: 'Execute callback after delay' },
  { label: 'setInterval', detail: 'setInterval(callback, delay)', documentation: 'Execute callback repeatedly' },
  { label: 'clearTimeout', detail: 'clearTimeout(timeoutId)', documentation: 'Cancel a timeout' },
  { label: 'clearInterval', detail: 'clearInterval(intervalId)', documentation: 'Cancel an interval' },
  { label: 'encodeURI', detail: 'encodeURI(uri)', documentation: 'Encode a URI' },
  { label: 'decodeURI', detail: 'decodeURI(encodedURI)', documentation: 'Decode a URI' },
  { label: 'encodeURIComponent', detail: 'encodeURIComponent(str)', documentation: 'Encode a URI component' },
  { label: 'decodeURIComponent', detail: 'decodeURIComponent(encodedURI)', documentation: 'Decode a URI component' },
];

// TypeScript built-in functions (extends JavaScript)
export const typescriptBuiltins: CompletionItem[] = [
  ...javascriptBuiltins,
  // TypeScript specific items can be added here
];

// Get suggestions based on language
export const getBuiltinSuggestions = (language: string): CompletionItem[] => {
  switch (language.toLowerCase()) {
    case 'python':
      return pythonBuiltins;
    case 'javascript':
      return javascriptBuiltins;
    case 'typescript':
      return typescriptBuiltins;
    default:
      return [];
  }
};
