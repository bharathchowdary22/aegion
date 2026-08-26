import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { Message } from "@/lib/api";

interface MessageListProps {
  messages: Message[];
  loadingMessage?: string;
}

export default function MessageList({ messages, loadingMessage }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessage]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
          <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <h2 className="text-xl font-medium text-gray-400">Welcome to Aegion</h2>
          <p className="text-sm">Start a conversation to begin your security analysis.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto w-full pb-4">
          {messages.map((msg, i) => (
            <MessageItem key={i} message={msg} />
          ))}
          
          {loadingMessage !== undefined && (
            <MessageItem 
              message={{
                role: "assistant", 
                content: loadingMessage || "▋"
              }} 
            />
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
