
import React from 'react';
import { ChatThread } from '../types';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  isOpen,
  onToggle
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 border-r border-slate-800 
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Easing</h1>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => { onNewChat(); if(window.innerWidth < 1024) onToggle(); }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Session
          </button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Conversations
          </div>
          {threads.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No chat history yet.
            </div>
          ) : (
            threads.sort((a, b) => b.updatedAt - a.updatedAt).map((thread) => (
              <div 
                key={thread.id}
                className={`group flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                  activeThreadId === thread.id 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
                onClick={() => { onSelectThread(thread.id); if(window.innerWidth < 1024) onToggle(); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="flex-1 truncate text-sm font-medium">{thread.title}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>© 2024 Easing AI</p>
          <p className="mt-1">Powered by Gemini 3</p>
        </div>
      </aside>
    </>
  );
};
