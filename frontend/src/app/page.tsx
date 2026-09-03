"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import MessageList from "@/components/Chat/MessageList";
import ChatInput from "@/components/Chat/ChatInput";
import { Message, streamChat, streamScan, getConversationDetails, getConversations } from "@/lib/api";

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateUrl = (id: string | null) => {
    if (typeof window !== "undefined") {
      if (id) {
        window.history.replaceState(null, "", `?id=${id}`);
      } else {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  };

  const loadConversationsList = async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch {
      // User might be unauthenticated or offline
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversationsList();
  }, []);

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
      loadConversationsList();
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
      setMessages(
        details.messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load conversation";
      setError(msg);
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
      const id = urlParams.get("id");
      if (id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectConversation(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#111111] overflow-hidden">
      {/* Sidebar with Chat History */}
      <Sidebar
        conversations={conversations}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <Header
          title="AI Security Copilot"
          subtitle="Real-time vulnerability advisory & threat triage"
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF1E6] text-[#FF6B00] border border-[#FFD2B2] font-mono font-bold">
              OLLAMA ENGINE
            </span>
          }
        />

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Area */}
        <MessageList
          messages={messages}
          loadingMessage={streamingContent}
          onQuickAction={(prompt) => handleSendMessage(prompt, false)}
        />

        {/* Input Bar */}
        <div className="bg-white border-t border-[#EAEAEA] p-2">
          <ChatInput
            onSendMessage={handleSendMessage}
            onStop={handleStop}
            isGenerating={isGenerating}
          />
          <div className="text-center pb-2 text-[11px] text-gray-400 font-mono">
            AEGION Sentinel Defense • Encrypted Session
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
