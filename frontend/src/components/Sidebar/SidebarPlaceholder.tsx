export default function SidebarPlaceholder() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-full text-gray-300">
      <div className="p-4 font-bold text-xl tracking-wider text-white border-b border-gray-800">
        AEGION
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
        <p className="text-sm text-gray-500 mb-2">Phase 1</p>
        <p className="text-xs text-gray-600">
          History and persistent sessions are planned for a future phase.
        </p>
      </div>
    </aside>
  );
}
