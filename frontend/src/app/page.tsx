"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import MessageList from "@/components/Chat/MessageList";
import ChatInput from "@/components/Chat/ChatInput";
import { Message, streamChat, streamScan, getConversationDetails } from "@/lib/api";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateUrl = (id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) {
        window.history.replaceState(null, '', `?id=${id}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  };


  const handleSendMessage = async (content: string, isScan: boolean) => {
    const userMessage: Message = { role: "user", content: isScan ? `[Code Scan Request]\n\n${content}` : content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setError(null);
    setIsGenerating(true);
    setStreamingContent("");

    abortControllerRef.current = new AbortController();
    let currentStream = "";

    const onChunk = (chunk: string) => {
      currentStream += chunk;
      setStreamingContent(currentStream);
    };

    const onErr = (errorMsg: string) => {
      setError(errorMsg);
      setIsGenerating(false);
      setStreamingContent(undefined);
    };

    const onComplete = () => {
      if (currentStream) {
        setMessages([...updatedMessages, { role: "assistant", content: currentStream }]);
      }
      setIsGenerating(false);
      setStreamingContent(undefined);
    };

    if (isScan) {
      await streamScan(
        content,
        onChunk,
        onErr,
        onComplete,
        abortControllerRef.current.signal
      );
    } else {
      await streamChat(
        updatedMessages,
        conversationId || undefined,
        (chunk) => {
          // Check for conversation_id event injected by backend
          try {
            const parsed = JSON.parse(chunk);
            if (parsed.type === "conversation_id" && parsed.conversation_id) {
              setConversationId(parsed.conversation_id);
              updateUrl(parsed.conversation_id);
              return;
            }
          } catch {
            // normal text chunk
          }
          onChunk(chunk);
        },
        onErr,
        onComplete,
        abortControllerRef.current.signal
      );
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSelectConversation = async (id: string) => {
    setConversationId(id);
    updateUrl(id);
    setMessages([]);
    setError(null);
    try {
      const details = await getConversationDetails(id);
      setMessages(details.messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load conversation");
      } else {
        setError("Failed to load conversation");
      }
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    updateUrl(null);
    setMessages([]);
    setError(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectConversation(id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <Sidebar 
        selectedId={conversationId} 
        onSelectConversation={handleSelectConversation} 
        onNewChat={handleNewChat} 
      />
      
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-14 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-900/50 backdrop-blur-sm z-10">
          <div className="font-semibold tracking-wide text-gray-200">
            Aegion Chat
          </div>
          <div className="text-xs text-gray-500 font-mono tracking-wider">
            PHASE 4
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
