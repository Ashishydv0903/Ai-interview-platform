import React, { useState } from 'react';
import { Code, Play, CheckCircle2, Copy, Terminal, RefreshCw } from 'lucide-react';

export default function CodeSandboxWidget({ initialCode, onCodeChange, onSubmitCode }) {
  const [code, setCode] = useState(
    initialCode || 
`// Technical Implementation Sandbox
// Write your code snippet or algorithm structure below

function solveProblem(input) {
  // TODO: Implement solution logic
  console.log("Processing input:", input);
  return input;
}

// Test call
solveProblem("sample_data");`
  );
  
  const [outputLog, setOutputLog] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setOutputLog("⚡ Compiling JavaScript runtime environment...\n");

    setTimeout(() => {
      try {
        let logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')),
          error: (...args) => logs.push(`[ERROR] ${args.join(' ')}`),
          warn: (...args) => logs.push(`[WARN] ${args.join(' ')}`)
        };

        // Safe eval simulation for frontend output sandbox
        const runnableFn = new Function('console', code);
        runnableFn(customConsole);

        setOutputLog(prev => prev + (logs.length > 0 ? logs.join('\n') : "✨ Execution completed with 0 errors. Return value: OK"));
      } catch (err) {
        setOutputLog(prev => prev + `❌ Runtime Error: ${err.message}`);
      }
      setIsRunning(false);
    }, 600);
  };

  const handleCodeEdit = (e) => {
    setCode(e.target.value);
    if (onCodeChange) onCodeChange(e.target.value);
  };

  return (
    <div className="bg-[#071B2E] rounded-xl border border-[#1C476E] overflow-hidden shadow-2xl flex flex-col my-4">
      {/* Editor Toolbar */}
      <div className="bg-[#0B2641] px-4 py-2 border-b border-[#1C476E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-[#5CDB94]" />
          <span className="text-xs font-semibold text-slate-200">Live Code Sandbox</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#071B2E] text-slate-300 font-mono border border-[#1C476E]">JS / React</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1 bg-[#5CDB94] hover:bg-[#4CD087] text-[#0B2540] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run & Test
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1C476E]">
        <div className="p-3 bg-[#071B2E] font-mono text-xs">
          <textarea
            value={code}
            onChange={handleCodeEdit}
            rows={10}
            className="w-full h-full bg-transparent text-emerald-200 focus:outline-none resize-none font-mono text-xs leading-relaxed"
            placeholder="Write JavaScript code snippet..."
          />
        </div>

        {/* Output Console */}
        <div className="p-3 bg-[#051424] font-mono text-xs text-slate-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-[#1C476E] mb-2">
              <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[11px] font-medium text-slate-300">Execution Output</span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
              {outputLog || "// Press 'Run & Test' to execute code snippet in sandbox..."}
            </pre>
          </div>
          
          <button
            onClick={() => onSubmitCode && onSubmitCode(code)}
            className="mt-3 w-full py-1.5 bg-[#5CDB94]/20 hover:bg-[#5CDB94]/30 border border-[#5CDB94]/40 text-[#5CDB94] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5CDB94]" />
            Attach Code to Answer Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}
