import React from "react";
import { Message } from "@/lib/api";

export default function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`flex items-start gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${
            isUser
              ? "bg-[#111111] text-white"
              : "bg-gradient-to-tr from-[#E85000] to-[#FF6B00] text-white"
          }`}
        >
          {isUser ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-5 py-4 ${
            isUser
              ? "bg-gradient-to-r from-[#FF6B00] to-[#FF7A00] text-white rounded-tr-none shadow-sm"
              : "bg-white text-[#111111] rounded-tl-none border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 space-x-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isUser ? "text-white/80" : "text-[#FF6B00]"}`}>
              {isUser ? "You" : "AEGION Copilot"}
            </span>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-sm font-sans">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}
