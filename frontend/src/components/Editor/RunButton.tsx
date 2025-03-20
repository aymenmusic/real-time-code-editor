import { useEditorStore } from '../../store/editorStore';
import { useExecutionStore } from '../../store/executionStore';
import { executeCode } from '../../store/executionStore';

const RunButton = () => {
  const { code, language } = useEditorStore();
  const { isExecuting } = useExecutionStore();

  const handleRunCode = async () => {
    if (isExecuting) return;
    
    await executeCode(code, language);
  };

  return (
    <button 
      className={`run-button ${isExecuting ? 'running' : ''}`}
      onClick={handleRunCode}
      disabled={isExecuting}
    >
      {isExecuting ? 'Running...' : 'Run Code'}
    </button>
  );
};

export default RunButton;
