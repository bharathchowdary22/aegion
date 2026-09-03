"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (msg: string, isScan: boolean) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export default function ChatInput({ onSendMessage, onStop, isGenerating }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isScanMode, setIsScanMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input, isScanMode);
      setInput("");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 p-4">
      {/* Scan Mode Toggle */}
      <div className="flex items-center justify-between px-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-[#FF6B00] transition-colors select-none">
          <input 
            type="checkbox" 
            checked={isScanMode} 
            onChange={(e) => setIsScanMode(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer accent-[#FF6B00]"
          />
          <span className={isScanMode ? "text-[#FF6B00] font-bold" : ""}>
            Security Scan / SAST Mode
          </span>
        </label>
        {isScanMode && (
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#FFF1E6] text-[#E85000] border border-[#FFD2B2]">
            Static Code Analysis
          </span>
        )}
      </div>
      
      {/* Input Box */}
      <div className="relative flex items-end bg-white rounded-2xl border border-[#EAEAEA] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:border-[#FF6B00] focus-within:shadow-[0_0_0_3px_rgba(255,107,0,0.1)] transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={isScanMode ? "Paste source code or configuration to scan for vulnerabilities..." : "Ask AEGION Security Copilot..."}
          className="flex-1 max-h-36 bg-transparent text-[#111111] placeholder:text-gray-400 resize-none outline-none py-2.5 px-3 text-sm font-sans"
          rows={1}
        />
        
        <div className="pl-2 pb-1">
          {isGenerating ? (
            <button 
              onClick={onStop}
              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
              title="Stop response"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
              </svg>
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="p-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF7A00] text-white disabled:opacity-40 disabled:from-gray-300 disabled:to-gray-400 rounded-xl hover:shadow-[0_4px_12px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center cursor-pointer"
              title="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
