import Link from "next/link";

export default function SidebarPlaceholder() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-full text-gray-300">
      <div className="p-4 font-bold text-xl tracking-wider text-white border-b border-gray-800">
        AEGION
      </div>
      
      <div className="flex-1 p-4 space-y-2">
        <Link href="/" className="block w-full p-2 rounded hover:bg-gray-800 text-sm">
          💬 Chat
        </Link>
        <Link href="/dashboard" className="block w-full p-2 rounded hover:bg-gray-800 text-sm">
          🛡️ Security Scanner
        </Link>
        <Link href="/soc" className="block w-full p-2 rounded hover:bg-gray-800 text-sm text-blue-400 font-medium bg-blue-900/10 border border-blue-900/30">
          🚨 SOC Dashboard
        </Link>
      </div>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        Phase 8<br />SIEM & SOC Integration
      </div>
    </aside>
  );
}
