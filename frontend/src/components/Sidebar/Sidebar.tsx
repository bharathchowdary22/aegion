import { useEffect, useState } from "react";
import { getConversations, deleteConversation } from "@/lib/api";

type ConversationPreview = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function Sidebar({
  onSelectConversation,
  selectedId,
  onNewChat,
}: {
  onSelectConversation: (id: string) => void;
  selectedId: string | null;
  onNewChat: () => void;
}) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, [selectedId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteConversation(id);
      if (selectedId === id) {
        onNewChat();
      } else {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
      alert("Failed to delete conversation");
    }
  };

  const groupConversations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: ConversationPreview[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    conversations.forEach((c) => {
      const d = new Date(c.updated_at);
      if (d >= today) {
        groups.Today.push(c);
      } else if (d >= yesterday) {
        groups.Yesterday.push(c);
      } else {
        groups.Older.push(c);
      }
    });

    return groups;
  };

  const groups = groupConversations();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-full text-gray-300">
      <div className="p-4 font-bold text-xl tracking-wider text-white border-b border-gray-800 flex justify-between items-center">
        <span>AEGION</span>
      </div>
      
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <span>+ New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading history...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No recent conversations</div>
        ) : (
          <div className="space-y-4 p-2">
            {Object.entries(groups).map(([label, convs]) => (
              convs.length > 0 && (
                <div key={label}>
                  <div className="px-2 text-xs font-semibold text-gray-500 mb-1 tracking-wider uppercase">
                    {label}
                  </div>
                  <div className="space-y-1">
                    {convs.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectConversation(c.id)}
                        className={`group cursor-pointer flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                          selectedId === c.id ? "bg-gray-800 text-white" : "hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="truncate flex-1 pr-2">
                          {c.title || "New Conversation"}
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, c.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                          title="Delete conversation"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        Phase 7<br />Persistent chat history
      </div>
    </aside>
  );
}
