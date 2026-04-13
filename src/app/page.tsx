"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== Types =====
interface Issue {
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  message: string;
  code: string;
  suggestion: string;
}

interface Summary {
  totalIssues: number;
  errors: number;
  warnings: number;
  suggestions: number;
  overallStatus: string;
}

interface AnalysisResult {
  summary: Summary;
  issues: Issue[];
  rawResponse?: string;
}

interface FileItem {
  id: string;
  name: string;
  content: string;
  analysis: AnalysisResult | null;
}

// ===== Sample Code =====
const SAMPLE_CODE_1 = `import pandas as pd
import numpy as np

def calculate_statistics(data_path):
    # Load the dataset
    df = pd.read_csv(data_path)
    
    # Calculate basic stats
    mean_value = df['price'].mean()
    median_value = df['price'].medain()
    
    # Group by category
    grouped = df.groupby('category')
    results = grouped.agg({
        'price': ['mean', 'sum', 'count']
    })
    
    # Filter outliers
    threshold = mean_value * 3
    filtered = df[df['price'] > threshold]
    
    # Calculate percentage
    total = len(df)
    outlier_count = len(filtered)
    percentage = outlier_count / total * 100
    
    print(f"Total records: {total}")
    print(f"Outliers: {outlier_count}")
    print(f"Percentage: {percentage:2f}%")
    
    # Missing values
    missing = df.isnull().sum()
    for col in missing:
        print(f"{col}: {missing[col]}")
    
    # Export results
    results.to_csv('output/results.csv')
    
    return results

# Main execution
data = calculate_statistics('data/sales.csv')
print(data.head())`;

const SAMPLE_CODE_2 = `class DataProcessor:
    def __init__(self, filepath):
        self.filepath = filepath
        self.data = None
        self._load_data()
    
    def _load_data(self):
        import csv
        with open(self.filepath, 'r') as f:
            reader = csv.DictReader(f)
            self.data = list(reader)
    
    def filter_by_column(self, column, value):
        result = []
        for row in self.data:
            if row[column] == value:
                result.append(row)
        return result
    
    def get_unique_values(self, column):
        unique = []
        for row in self.data:
            if row[column] not in unique:
                unique.append(row[column])
        return unique
    
    def aggregate(self, column, operation='mean'):
        values = [float(row[column]) for row in self.data]
        if operation == 'mean':
            return sum(values) / len(values)
        elif operation == 'max'
            return max(values)
        elif operation == 'min':
            return min(values)
    
    def save_output(self, data, output_path):
        import json
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

processor = DataProcessor('input/data.csv')
filtered = processor.filter_by_column('status', 'active')
print(f"Found {len(filtered)} records")`;

const SAMPLE_CODE_3 = `import os
import json
from datetime import datetime

def process_logs(log_dir):
    """Process all log files in a directory."""
    all_entries = []
    
    for filename in os.listdir(log_dir):
        if filename.endswith('.log'):
            filepath = os.path.join(log_dir, filename)
            with open(filepath, 'r') as f:
                lines = f.readlines()
            
            for line in lines:
                if 'ERROR' in line or 'WARNING' in line:
                    entry = parse_log_line(line)
                    all_entries.append(entry)
    
    return all_entries

def parse_log_line(line):
    parts = line.strip().split(' | ')
    return {
        'timestamp': parts[0],
        'level': parts[1],
        'message': parts[2],
        'parsed_at': datetime.now().isoformat()
    }

def generate_report(entries, output_file='report.json'):
    summary = {
        'total': len(entries),
        'errors': sum(1 for e in entries if e['level'] == 'ERROR'),
        'warnings': sum(1 for e in entries if e['level'] == 'WARNING'),
        'generated_at': datetime.now().isoformat()
    }
    
    with open(output_file, 'w') as f
        json.dump(summary, f, indent=2)
    
    print("Report generated successfully")
    return summary

entries = process_logs('./logs')
report = generate_report(entries)`;

// ===== Utility =====
let fileIdCounter = 0;
function createFile(name: string, content: string): FileItem {
  fileIdCounter++;
  return { id: `file-${fileIdCounter}`, name, content, analysis: null };
}

// ===== Syntax Highlighting =====
function highlightPython(code: string): string {
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>');
  html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="tok-string">$1</span>');
  html = html.replace(/(f?"[^"]*"|f?'[^']*')/g, '<span class="tok-string">$1</span>');

  const keywords = [
    "import","from","def","class","return","if","elif","else","for","while",
    "try","except","finally","with","as","raise","pass","break","continue",
    "in","not","and","or","is","lambda","yield","global","nonlocal","assert","del",
    "True","False","None",
  ];
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, "g");
    html = html.replace(regex, '<span class="tok-keyword">$1</span>');
  });

  const builtins = [
    "print","len","range","int","float","str","list","dict","set","tuple",
    "type","input","open","abs","max","min","sum","sorted","enumerate",
    "zip","map","filter","isinstance","super",
  ];
  builtins.forEach((fn) => {
    const regex = new RegExp(`\\b(${fn})(?=\\()`, "g");
    html = html.replace(regex, '<span class="tok-builtin">$1</span>');
  });

  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');
  html = html.replace(/(<span class="tok-keyword">def<\/span>\s+)(\w+)/g, "$1<span class=\"tok-funcname\">$2</span>");
  html = html.replace(/(<span class="tok-keyword">class<\/span>\s+)(\w+)/g, "$1<span class=\"tok-funcname\">$2</span>");
  html = html.replace(/(\w+)(?=\s*\()/g, '<span class="tok-call">$1</span>');
  html = html.replace(/(@\w+)/g, '<span class="tok-decorator">$1</span>');

  return html;
}

// ===== Severity Components =====
function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "error":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.5" fill="#f85149" fillOpacity="0.2" stroke="#f85149" />
          <path d="M8 4.5V9" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="#f85149" />
        </svg>
      );
    case "warning":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M7.56 1.87L1.1 12.98C.95 13.24 1.14 13.56 1.44 13.56H14.37C14.67 13.56 14.86 13.24 14.71 12.98L8.44 1.87C8.29 1.61 7.71 1.61 7.56 1.87Z" fill="#d29922" fillOpacity="0.2" stroke="#d29922" strokeWidth="0.75" />
          <path d="M8 5.5V8.5" stroke="#d29922" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.75" fill="#d29922" />
        </svg>
      );
    case "info":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.5" fill="#58a6ff" fillOpacity="0.2" stroke="#58a6ff" />
          <path d="M7.25 7V5.5H8.75V7H7.25Z" fill="#58a6ff" />
          <path d="M7.25 8V11H8.75V8H7.25Z" fill="#58a6ff" />
        </svg>
      );
    default:
      return null;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    error: "bg-[#f85149]/15 text-[#f85149] border-[#f85149]/30",
    warning: "bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30",
    info: "bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30",
  };
  const labels = { error: "Error", warning: "Warning", info: "Info" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${colors[severity as keyof typeof colors] || colors.info}`}>
      {labels[severity as keyof typeof labels] || "Info"}
    </span>
  );
}

// ===== Line Numbers =====
function LineNumbers({ lineCount, errorLines, selectedLine, onSelectLine }: {
  lineCount: number; errorLines: Set<number>; selectedLine: number | null; onSelectLine: (line: number) => void;
}) {
  return (
    <div className="select-none flex-shrink-0 w-[55px] text-right pr-3 pt-1 pb-1 border-r border-[#30363d]">
      {Array.from({ length: lineCount }, (_, i) => {
        const lineNum = i + 1;
        const hasError = errorLines.has(lineNum);
        const isSelected = selectedLine === lineNum;
        return (
          <div key={lineNum} onClick={() => onSelectLine(lineNum)}
            className={`text-[13px] leading-[22px] cursor-pointer transition-colors ${isSelected ? "text-white" : hasError ? "text-[#f85149]" : "text-[#484f58]"}`}>
            {lineNum}
          </div>
        );
      })}
    </div>
  );
}

// ===== Main Component =====
export default function ErrorDetector() {
  // File management state
  const [files, setFiles] = useState<FileItem[]>([
    createFile("statistics.py", SAMPLE_CODE_1),
    createFile("data_processor.py", SAMPLE_CODE_2),
    createFile("log_analyzer.py", SAMPLE_CODE_3),
  ]);
  const [activeFileId, setActiveFileId] = useState<string>("file-1");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const activeFile = useMemo(() => files.find((f) => f.id === activeFileId) || files[0], [files, activeFileId]);
  const code = activeFile?.content || "";
  const analysis = activeFile?.analysis || null;
  const lineCount = code.split("\n").length;

  const errorLines = useMemo(() => {
    const s = new Set<number>();
    analysis?.issues?.forEach((issue) => s.add(issue.line));
    return s;
  }, [analysis]);

  const filteredIssues = analysis?.issues?.filter((issue) => {
    if (!selectedLine) return true;
    return issue.line === selectedLine;
  }) || [];

  // Total errors across all files for status bar
  const totalProblems = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.analysis?.summary.totalIssues || 0), 0);
  }, [files]);

  // ===== File Actions =====
  const addNewFile = useCallback(() => {
    const name = `untitled_${files.length + 1}.py`;
    const newFile = createFile(name, `# ${name}\n# Start writing your Python code here\n\n`);
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setSelectedLine(null);
    setRenamingId(newFile.id);
    setRenameValue(name);
  }, [files.length]);

  const deleteFile = useCallback((id: string) => {
    if (files.length <= 1) return; // Keep at least one file
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (id === activeFileId) {
        const idx = prev.findIndex((f) => f.id === id);
        const newActive = next[Math.min(idx, next.length - 1)] || next[0];
        if (newActive) setActiveFileId(newActive.id);
      }
      return next;
    });
  }, [files.length, activeFileId]);

  const selectFile = useCallback((id: string) => {
    setActiveFileId(id);
    setSelectedLine(null);
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content, analysis: null } : f))
    );
    setSelectedLine(null);
  }, []);

  const startRename = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      setRenamingId(id);
      setRenameValue(file.name);
      setTimeout(() => renameInputRef.current?.select(), 50);
    }
  }, [files]);

  const confirmRename = useCallback(() => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    let name = renameValue.trim();
    if (!name.endsWith(".py")) name += ".py";
    setFiles((prev) =>
      prev.map((f) => (f.id === renamingId ? { ...f, name } : f))
    );
    setRenamingId(null);
  }, [renamingId, renameValue]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const newFile = createFile(file.name, content);
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setSelectedLine(null);
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }, []);

  // ===== Analysis =====
  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setSelectedLine(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "python" }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFileId ? { ...f, analysis: data.analysis } : f))
        );
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, activeFileId]);

  const handleAnalyzeAll = useCallback(async () => {
    setIsAnalyzing(true);
    setSelectedLine(null);
    try {
      const promises = files.map(async (file) => {
        if (!file.content.trim()) return file;
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: file.content, language: "python" }),
          });
          const data = await res.json();
          if (data.success) return { ...file, analysis: data.analysis };
        } catch { /* skip */ }
        return file;
      });
      const results = await Promise.all(promises);
      setFiles(results);
    } catch (err) {
      console.error("Batch analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [files]);

  // ===== Editor Actions =====
  const handleScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleSelectLine = useCallback((line: number) => {
    setSelectedLine((prev) => (prev === line ? null : line));
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [code]);

  const handleClear = useCallback(() => {
    updateFileContent(activeFileId, "");
  }, [activeFileId, updateFileContent]);

  // ===== Status Helpers =====
  const getFileStatusIcon = (file: FileItem) => {
    if (!file.analysis) return null;
    switch (file.analysis.summary.overallStatus) {
      case "has_errors":
        return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#f85149" }} />;
      case "has_warnings":
        return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#d29922" }} />;
      case "clean":
        return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#3fb950" }} />;
      default: return null;
    }
  };

  const getOverallStatusIcon = () => {
    if (!analysis) return null;
    switch (analysis.summary.overallStatus) {
      case "has_errors": return <SeverityIcon severity="error" />;
      case "has_warnings": return <SeverityIcon severity="warning" />;
      case "clean":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7.5" fill="#3fb950" fillOpacity="0.2" stroke="#3fb950" />
            <path d="M6.5 8L7.5 9L10 6" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#1e1e1e", color: "#cccccc" }}>
      {/* Hidden file input for upload */}
      <input ref={fileInputRef} type="file" accept=".py,.txt" multiple className="hidden" onChange={handleFileUpload} />

      {/* ===== Title Bar ===== */}
      <div className="flex items-center h-[38px] flex-shrink-0 px-3 border-b" style={{ background: "#323233", borderColor: "#252526" }}>
        <div className="flex items-center gap-2 mr-4">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: "#cccccc" }}>
            PyLint AI — Error Detection &amp; Suggestion Tool
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#58a6ff20", color: "#58a6ff", border: "1px solid #58a6ff40" }}>
            {files.length} file{files.length > 1 ? "s" : ""} &middot; Python 3.x
          </span>
        </div>
      </div>

      {/* ===== Tab Bar ===== */}
      <div className="flex items-center h-[36px] flex-shrink-0" style={{ background: "#252526", borderBottom: "1px solid #181818" }}>
        <div className="flex items-center overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => selectFile(file.id)}
                className={`flex items-center gap-2 px-3 h-full cursor-pointer text-[13px] flex-shrink-0 border-r group relative transition-colors ${
                  isActive ? "" : "hover:bg-white/5"
                }`}
                style={{
                  color: isActive ? "#ffffff" : "#999999",
                  background: isActive ? "#1e1e1e" : undefined,
                  borderTop: isActive ? "2px solid #007acc" : "2px solid transparent",
                  borderRight: "1px solid #181818",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="1" width="12" height="14" rx="1.5" fill={isActive ? "#3794ff" : "transparent"} fillOpacity={isActive ? 0.2 : 0} stroke={isActive ? "#3794ff" : "#666"} strokeWidth="1" />
                  <text x="8" y="10" textAnchor="middle" fontSize="6" fill={isActive ? "#3794ff" : "#666"} fontWeight="bold">Py</text>
                </svg>
                <span className="whitespace-nowrap">{file.name}</span>
                {file.analysis && (
                  <span className="text-[9px] px-1 py-0 rounded" style={{
                    background: file.analysis.summary.errors > 0 ? "#f8514920" : file.analysis.summary.warnings > 0 ? "#d2992220" : "#3fb95020",
                    color: file.analysis.summary.errors > 0 ? "#f85149" : file.analysis.summary.warnings > 0 ? "#d29922" : "#3fb950",
                  }}>
                    {file.analysis.summary.totalIssues}
                  </span>
                )}
                {/* Close tab button */}
                {files.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 ml-1"
                    style={{ lineHeight: 0 }}
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 overflow-hidden border-r flex flex-col"
              style={{ background: "#252526", borderColor: "#181818" }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 h-[36px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#bbbbbb" }}>
                <span>Explorer</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={addNewFile} className="p-1 rounded hover:bg-white/10 transition-colors" title="New File">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#cccccc" strokeWidth="1.5">
                      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded hover:bg-white/10 transition-colors" title="Upload Files">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#cccccc" strokeWidth="1.5">
                      <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button onClick={() => setShowSidebar(false)} className="p-1 rounded hover:bg-white/5 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3L3 13h2l1-2.5h4L11 13h2L8 3zm-1 6L8 5.5 9 9H7z" /></svg>
                  </button>
                </div>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-auto px-2 pb-2">
                <div className="text-[11px] font-semibold px-2 py-1.5 uppercase tracking-wider flex items-center justify-between" style={{ color: "#bbbbbb" }}>
                  <span>Python Files</span>
                  <span className="text-[10px] font-normal" style={{ color: "#555" }}>{files.length}</span>
                </div>

                <div className="space-y-0.5">
                  {files.map((file) => {
                    const isActive = file.id === activeFileId;
                    const isRenaming = file.id === renamingId;
                    return (
                      <div
                        key={file.id}
                        className={`group flex items-center rounded transition-colors ${
                          isActive ? "bg-[#37373d]" : "hover:bg-white/5"
                        }`}
                        style={{ paddingLeft: "8px", paddingRight: "4px" }}
                      >
                        {/* File status indicator */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => selectFile(file.id)}>
                          <span className="text-[13px] flex-shrink-0">🐍</span>
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={confirmRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmRename();
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                              className="flex-1 text-[13px] px-1 py-0.5 rounded outline-none min-w-0"
                              style={{ background: "#1e1e1e", color: "#cccccc", border: "1px solid #007acc", fontFamily: "'Geist Mono', monospace" }}
                              autoFocus
                            />
                          ) : (
                            <span className={`text-[13px] truncate ${isActive ? "text-white" : "text-[#cccccc]"}`}>
                              {file.name}
                            </span>
                          )}
                          {getFileStatusIcon(file)}
                        </div>

                        {/* File action buttons */}
                        {!isRenaming && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); startRename(file.id); }}
                              className="p-0.5 rounded hover:bg-white/10 transition-colors"
                              title="Rename"
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.2">
                                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {files.length > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                                title="Delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#f85149" strokeWidth="1.2">
                                  <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6.5 7v4M9.5 7v4M4 4l.7 8.4a1.5 1.5 0 001.5 1.1h3.6a1.5 1.5 0 001.5-1.1L12 4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons at bottom of file list */}
                <div className="mt-3 space-y-1 px-1">
                  <button
                    onClick={addNewFile}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px] transition-colors hover:bg-white/5"
                    style={{ color: "#58a6ff" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                    </svg>
                    New File
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px] transition-colors hover:bg-white/5"
                    style={{ color: "#58a6ff" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Upload .py Files
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={handleAnalyzeAll}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px] transition-colors hover:bg-white/5 disabled:opacity-40"
                      style={{ color: "#dcdcaa" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="4" cy="4" r="2.5" /><circle cx="12" cy="12" r="2.5" />
                        <path d="M6.5 5.5l3 5" strokeLinecap="round" />
                      </svg>
                      Analyze All Files
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar Footer - Stats */}
              <div className="flex-shrink-0 px-3 py-2 border-t text-[11px]" style={{ borderColor: "#181818" }}>
                <div className="flex items-center justify-between" style={{ color: "#666" }}>
                  <span>{files.length} file{files.length > 1 ? "s" : ""}</span>
                  {totalProblems > 0 && (
                    <span style={{ color: "#f85149" }}>{totalProblems} problem{totalProblems > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle (when collapsed) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="flex-shrink-0 w-[48px] flex items-center justify-center border-r hover:bg-white/5 transition-colors"
            style={{ background: "#252526", borderColor: "#181818" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#cccccc">
              <rect x="2" y="1" width="12" height="2" rx="1" />
              <rect x="2" y="5" width="12" height="2" rx="1" />
              <rect x="2" y="9" width="12" height="2" rx="1" />
              <rect x="2" y="13" width="12" height="2" rx="1" />
            </svg>
          </button>
        )}

        {/* ===== Editor Area ===== */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#1e1e1e" }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 h-[44px] flex-shrink-0 border-b" style={{ borderColor: "#30363d" }}>
            <div className="flex items-center gap-2">
              <button
                onClick={addNewFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all hover:bg-white/10"
                style={{ color: "#cccccc" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New File
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all hover:bg-white/10"
                style={{ color: "#cccccc" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload
              </button>
              <div className="w-px h-5 mx-1" style={{ background: "#30363d" }} />
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all hover:bg-white/10"
                style={{ color: "#cccccc" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6.5 7v4M9.5 7v4M4 4l.7 8.4a1.5 1.5 0 001.5 1.1h3.6a1.5 1.5 0 001.5-1.1L12 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Clear
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all hover:bg-white/10"
                style={{ color: "#cccccc" }}
              >
                {copySuccess ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3fb950" strokeWidth="1.5">
                      <path d="M3 8l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ color: "#3fb950" }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="4" y="4" width="9" height="9" rx="1.5" />
                      <path d="M4 8H2.5A1.5 1.5 0 011 6.5v-3A1.5 1.5 0 012.5 2H8" strokeLinecap="round" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Analyze Buttons */}
            <div className="flex items-center gap-2">
              {files.length > 1 && (
                <motion.button
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzing || files.every((f) => !f.content.trim())}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border"
                  style={{
                    background: "transparent",
                    color: "#dcdcaa",
                    borderColor: "#dcdcaa40",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="4" cy="4" r="2.5" /><circle cx="12" cy="12" r="2.5" />
                    <path d="M6.5 5.5l3 5" strokeLinecap="round" />
                  </svg>
                  Analyze All
                </motion.button>
              )}
              <motion.button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !code.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: isAnalyzing ? "linear-gradient(135deg, #1a3a5c, #1a4a6c)" : "linear-gradient(135deg, #0078d4, #0063b1)",
                  color: "#ffffff",
                  boxShadow: isAnalyzing ? "none" : "0 4px 15px rgba(0, 120, 212, 0.3)",
                }}
              >
                {isAnalyzing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 2a6 6 0 016 6" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M6 6l4 2-4 2V6z" fill="currentColor" stroke="none" />
                  </svg>
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze Code"}
              </motion.button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-auto relative" style={{ fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace" }}>
            <div className="flex min-h-full relative">
              <LineNumbers lineCount={lineCount} errorLines={errorLines} selectedLine={selectedLine} onSelectLine={handleSelectLine} />
              <div className="flex-1 relative overflow-hidden">
                <pre
                  ref={overlayRef}
                  className="absolute inset-0 p-1 pointer-events-none overflow-hidden text-[13px] leading-[22px]"
                  style={{ whiteSpace: "pre", tabSize: 4, caretColor: "#aeafad" }}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightPython(code) + "\n" }}
                />
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => updateFileContent(activeFileId, e.target.value)}
                  onScroll={handleScroll}
                  spellCheck={false}
                  className="absolute inset-0 w-full h-full p-1 resize-none text-[13px] leading-[22px] outline-none"
                  style={{ background: "transparent", color: "transparent", caretColor: "#aeafad", fontFamily: "inherit", tabSize: 4 }}
                  placeholder="Paste or type your Python code here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Right Panel - Problems ===== */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: analysis || isAnalyzing ? 420 : 0, opacity: analysis || isAnalyzing ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0 overflow-hidden border-l flex flex-col"
          style={{ background: "#252526", borderColor: "#181818" }}
        >
          <div className="flex items-center h-[36px] flex-shrink-0 px-2 border-b" style={{ borderColor: "#181818" }}>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium" style={{ background: "#1e1e1e", color: "#ffffff" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5S11.59 1.5 8 1.5z"
                  stroke={analysis?.summary.errors ? "#f85149" : "#3fb950"} strokeWidth="1.25"
                  fill={analysis?.summary.errors ? "#f8514915" : "#3fb95015"} />
                {analysis?.summary.errors
                  ? <text x="8" y="11.5" textAnchor="middle" fontSize="8" fill="#f85149" fontWeight="bold">!</text>
                  : <text x="8" y="11.5" textAnchor="middle" fontSize="8" fill="#3fb950" fontWeight="bold">✓</text>}
              </svg>
              Problems
              {analysis && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1"
                  style={{ background: analysis.summary.errors > 0 ? "#f8514920" : "#3fb95020", color: analysis.summary.errors > 0 ? "#f85149" : "#3fb950" }}>
                  {analysis.summary.totalIssues}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "#0078d4", borderRightColor: "#0078d440" }} />
                <div className="text-center">
                  <p className="text-[13px] font-medium" style={{ color: "#cccccc" }}>Analyzing your code...</p>
                  <p className="text-[11px] mt-1" style={{ color: "#666666" }}>AI is detecting errors and generating suggestions</p>
                </div>
              </div>
            )}

            {!isAnalyzing && analysis && (
              <div className="p-3">
                {/* Summary Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-3 mb-3 border"
                  style={{
                    background: analysis.summary.overallStatus === "clean" ? "#0d2818" : analysis.summary.overallStatus === "has_errors" ? "#2d1215" : "#2d2000",
                    borderColor: analysis.summary.overallStatus === "clean" ? "#23863640" : analysis.summary.overallStatus === "has_errors" ? "#f8514930" : "#d2992230",
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    {getOverallStatusIcon()}
                    <span className="text-[13px] font-semibold" style={{ color: "#cccccc" }}>
                      {activeFile.name}
                      {" — "}
                      {analysis.summary.overallStatus === "clean" ? "All checks passed" : analysis.summary.overallStatus === "has_errors" ? "Issues detected" : "Warnings found"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded" style={{ background: "#f8514912" }}>
                      <div className="text-[18px] font-bold" style={{ color: "#f85149" }}>{analysis.summary.errors}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "#f8514999" }}>Errors</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "#d2992212" }}>
                      <div className="text-[18px] font-bold" style={{ color: "#d29922" }}>{analysis.summary.warnings}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "#d2992299" }}>Warnings</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "#58a6ff12" }}>
                      <div className="text-[18px] font-bold" style={{ color: "#58a6ff" }}>{analysis.summary.suggestions}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "#58a6ff99" }}>Info</div>
                    </div>
                  </div>
                </motion.div>

                {selectedLine && (
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px]" style={{ color: "#888888" }}>Showing issues on line {selectedLine}</span>
                    <button onClick={() => setSelectedLine(null)} className="text-[11px] px-2 py-0.5 rounded hover:bg-white/5 transition-colors" style={{ color: "#58a6ff" }}>Show all</button>
                  </div>
                )}

                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredIssues.map((issue, index) => (
                      <motion.div key={`${issue.line}-${issue.severity}-${index}`}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                        className="rounded-lg border overflow-hidden transition-all hover:border-opacity-50"
                        style={{ background: "#1e1e1e", borderColor: issue.severity === "error" ? "#f8514930" : issue.severity === "warning" ? "#d2992230" : "#58a6ff30" }}>
                        <div className="flex items-start gap-2 p-3 cursor-pointer" onClick={() => handleSelectLine(issue.line)}>
                          <SeverityIcon severity={issue.severity} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={issue.severity} />
                              <span className="text-[11px] font-mono" style={{ color: "#666666" }}>Line {issue.line}{issue.column > 0 ? `, Col ${issue.column}` : ""}</span>
                            </div>
                            <p className="text-[12px] leading-[18px]" style={{ color: "#cccccc" }}>{issue.message}</p>
                          </div>
                        </div>
                        {issue.code && (
                          <div className="px-3 pb-2" style={{ background: "#161616" }}>
                            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#555555" }}>Problematic Code</div>
                            <code className="text-[11px] px-2 py-1 rounded block"
                              style={{ background: "#1a1a2e", color: issue.severity === "error" ? "#f85149" : issue.severity === "warning" ? "#d29922" : "#58a6ff", fontFamily: "'Geist Mono', monospace" }}>
                              {issue.code}
                            </code>
                          </div>
                        )}
                        {issue.suggestion && (
                          <div className="px-3 py-2 border-t" style={{ borderColor: "#30363d" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#3fb950" strokeWidth="1.5">
                                <path d="M8 2v8M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 13h12" strokeLinecap="round" />
                              </svg>
                              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#3fb950" }}>Suggested Fix</span>
                            </div>
                            <p className="text-[11px] leading-[17px] pl-[18px]" style={{ color: "#a0a0a0" }}>{issue.suggestion}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {analysis.summary.totalIssues === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="1.5" className="mx-auto">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[14px] font-medium mt-3 mb-1" style={{ color: "#3fb950" }}>No Issues Found</p>
                    <p className="text-[12px]" style={{ color: "#666666" }}>Your code looks good! No errors, warnings, or suggestions.</p>
                  </motion.div>
                )}

                {selectedLine && filteredIssues.length === 0 && analysis.summary.totalIssues > 0 && (
                  <div className="text-center py-8">
                    <p className="text-[12px]" style={{ color: "#666666" }}>No issues found on line {selectedLine}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== Status Bar ===== */}
      <div className="flex items-center justify-between h-[24px] flex-shrink-0 px-3 text-[11px]" style={{ background: "#007acc", color: "#ffffff" }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6S11.314 2 8 2zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" /></svg>
            <span>main</span>
          </div>
          <span className="flex items-center gap-1">
            {totalProblems > 0 ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#ffffff20" stroke="#ffffff" strokeWidth="1" />
                <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="bold">!</text>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#ffffff20" stroke="#ffffff" strokeWidth="1" />
                <text x="8" y="11" textAnchor="middle" fontSize="9" fill="#ffffff">✓</text>
              </svg>
            )}
            {totalProblems > 0 ? `${totalProblems} problems` : "Ready"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {selectedLine || 1}, Col 1</span>
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span className="flex items-center gap-1">Python</span>
          <span>PyLint AI</span>
        </div>
      </div>
    </div>
  );
}
