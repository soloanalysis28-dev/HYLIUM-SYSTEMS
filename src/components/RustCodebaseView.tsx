import React, { useState } from 'react';
import { RUST_PROJECT_FILES, RustFile } from '../data/rustCodebase';
import JSZip from 'jszip';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderTree, 
  Terminal, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const RustCodebaseView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile: RustFile = RUST_PROJECT_FILES[selectedFileIndex] || RUST_PROJECT_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      RUST_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `depotmaster_windows_rust_v2.4.0.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <span>Native Windows Rust Source Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade Rust codebase (Tauri v2 + Tokio + Rusqlite + Reqwest) targeting Windows x86_64-pc-windows-msvc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Archiving...' : 'Download Full Cargo Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Project File Tree */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-amber-400" />
              <span>Project Files</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">{RUST_PROJECT_FILES.length} files</span>
          </div>

          <div className="space-y-1">
            {RUST_PROJECT_FILES.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full p-2 rounded text-left font-mono text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">{file.language}</span>
                </button>
              );
            })}
          </div>

          {/* Compilation Quick Reference Card */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">Windows MSVC Build</span>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-slate-500"># Install Toolchain</div>
              <div className="text-amber-400">rustup target add x86_64-pc-windows-msvc</div>
              <div className="text-slate-500 pt-1"># Build Release EXE</div>
              <div className="text-emerald-400">cargo tauri build --release</div>
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">{currentFile.path}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {currentFile.language}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Box with Line Numbers */}
            <div className="mt-3 bg-slate-950 rounded-lg border border-slate-800 p-3 max-h-[520px] overflow-auto font-mono text-xs text-slate-300">
              <div className="table w-full">
                {currentFile.content.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-slate-900/50">
                    <span className="table-cell select-none text-right pr-4 text-slate-600 text-[11px] w-10">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre text-slate-200">
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Target: Windows 10/11 x64 (MSVC 2022)</span>
            <span>Safety: Pure Memory-Safe Rust / Zero-Unsoundness</span>
          </div>
        </div>
      </div>
    </div>
  );
};
