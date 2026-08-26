import { Message } from "@/lib/api";

export default function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div 
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser 
            ? "bg-blue-600 text-white rounded-br-none" 
            : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
        }`}
      >
        <div className="flex items-center mb-1 space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isUser ? "You" : "Aegion"}
          </span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed text-sm">
          {message.content}
        </div>
      </div>
    </div>
  );
}
