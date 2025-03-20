import { useRef, useEffect } from 'react';
import { useExecutionStore } from '../../store/executionStore';

const Terminal = () => {
  const { output, errors, isExecuting } = useExecutionStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, errors]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <h3>Terminal</h3>
        {isExecuting && <span className="executing-indicator">Running...</span>}
      </div>
      
      <div className="terminal-output" ref={terminalRef}>
        {output.length === 0 && errors.length === 0 ? (
          <div className="terminal-placeholder">
            Run your code to see output here
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="terminal-errors">
                {errors.map((error, index) => (
                  <div key={`error-${index}`} className="terminal-error">
                    {error}
                  </div>
                ))}
              </div>
            )}
            
            {output.map((line, index) => (
              <div key={`output-${index}`} className="terminal-line">
                {line}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Terminal;
