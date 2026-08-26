"use client";

import { useState, useRef } from "react";
import SidebarPlaceholder from "@/components/Sidebar/SidebarPlaceholder";
import MessageList from "@/components/Chat/MessageList";
import ChatInput from "@/components/Chat/ChatInput";
import { Message, streamChat } from "@/lib/api";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setError(null);
    setIsGenerating(true);
    setStreamingContent("");

    abortControllerRef.current = new AbortController();

    let currentStream = "";

    await streamChat(
      updatedMessages,
      undefined, // conversationId
      // onMessage (chunk)
      (chunk) => {
        currentStream += chunk;
        setStreamingContent(currentStream);
      },
      // onError
      (errorMsg) => {
        setError(errorMsg);
        setIsGenerating(false);
        setStreamingContent(undefined);
      },
      // onDone
      () => {
        if (currentStream) {
          setMessages([...updatedMessages, { role: "assistant", content: currentStream }]);
        }
        setIsGenerating(false);
        setStreamingContent(undefined);
      },
      abortControllerRef.current.signal
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <SidebarPlaceholder />
      
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-14 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900/50 backdrop-blur-sm z-10">
          <div className="font-semibold tracking-wide text-gray-200">
            Aegion Chat
          </div>
          <div className="text-xs text-gray-500 font-mono tracking-wider">
            PHASE 1
          </div>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 m-4 rounded-lg flex justify-between items-center z-10">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        <MessageList messages={messages} loadingMessage={streamingContent} />
        
        <div className="p-4 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent pt-12">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            onStop={handleStop}
            isGenerating={isGenerating}
          />
          <div className="text-center mt-3 text-xs text-gray-600">
            AI-Powered Cybersecurity & DevSecOps Assistant. Responses may be inaccurate.
          </div>
        </div>
      </main>
    </div>
  );
}
