import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export default function ChatInput({ onSendMessage, onStop, isGenerating }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex items-end bg-gray-800 rounded-xl border border-gray-700 p-2 shadow-lg">
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
        placeholder="Ask Aegion about security..."
        className="flex-1 max-h-36 bg-transparent text-white resize-none outline-none py-3 px-4"
        rows={1}
      />
      
      <div className="pl-2 pb-1">
        {isGenerating ? (
          <button 
            onClick={onStop}
            className="p-3 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-colors flex items-center justify-center"
            title="Stop generation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 text-white disabled:opacity-50 disabled:bg-gray-700 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center"
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
