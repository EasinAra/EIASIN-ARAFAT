
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { Message, ChatThread } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('easing_threads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('easing_threads', JSON.stringify(threads));
  }, [threads]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
    setInput('');
  };

  const handleDeleteThread = (id: string) => {
    setThreads(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeThreadId === id) {
        setActiveThreadId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGenerating) return;

    let currentThreadId = activeThreadId;
    let currentThreads = [...threads];

    // If no active thread or currently on a blank start, ensure we have one
    if (!currentThreadId) {
      const newId = Date.now().toString();
      const newThread: ChatThread = {
        id: newId,
        title: 'New Conversation',
        messages: [],
        updatedAt: Date.now()
      };
      currentThreads = [newThread, ...currentThreads];
      setThreads(currentThreads);
      setActiveThreadId(newId);
      currentThreadId = newId;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    // Update state with user message
    const updatedThreadsWithUser = currentThreads.map(t => {
      if (t.id === currentThreadId) {
        return {
          ...t,
          messages: [...t.messages, userMessage],
          updatedAt: Date.now()
        };
      }
      return t;
    });
    setThreads(updatedThreadsWithUser);
    setInput('');
    setIsGenerating(true);

    try {
      const activeT = updatedThreadsWithUser.find(t => t.id === currentThreadId);
      if (!activeT) return;

      const aiMessageId = (Date.now() + 1).toString();
      let aiContent = "";

      // Add a placeholder message for the AI
      setThreads(prev => prev.map(t => {
        if (t.id === currentThreadId) {
          return {
            ...t,
            messages: [...t.messages, { id: aiMessageId, role: 'model', content: '', timestamp: Date.now() }]
          };
        }
        return t;
      }));

      const stream = geminiService.streamChat(activeT.messages.concat(userMessage));
      
      for await (const chunk of stream) {
        aiContent += chunk;
        setThreads(prev => prev.map(t => {
          if (t.id === currentThreadId) {
            const lastMsg = t.messages[t.messages.length - 1];
            if (lastMsg.id === aiMessageId) {
              return {
                ...t,
                messages: [...t.messages.slice(0, -1), { ...lastMsg, content: aiContent }]
              };
            }
          }
          return t;
        }));
      }

      // After first exchange, generate a title if it's still default
      if (activeT.messages.length === 0) {
        const newTitle = await geminiService.generateTitle(userMessage.content);
        setThreads(prev => prev.map(t => t.id === currentThreadId ? { ...t, title: newTitle } : t));
      }

    } catch (error) {
      console.error("Chat error:", error);
      // Optional: Add error message to UI
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const promptStarters = [
    { label: "Plan my day", icon: "📅", text: "Help me organize my tasks for today and stay productive." },
    { label: "Write an email", icon: "📧", text: "Draft a polite email to my landlord asking about a minor repair." },
    { label: "Quick healthy recipe", icon: "🥗", text: "Give me a 15-minute healthy dinner idea with minimal ingredients." },
    { label: "Calming meditation", icon: "🧘", text: "Guide me through a 2-minute breathing exercise to reduce stress." }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar 
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 backdrop-blur-md z-30 sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 text-center font-semibold text-slate-200 truncate px-2">
            {activeThread?.title || 'Easing AI'}
          </div>
          <button 
            onClick={handleNewChat}
            className="p-2 -mr-2 text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto pt-4 md:pt-8 pb-32">
          {!activeThread || activeThread.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto px-6 flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                <span className="text-indigo-500 font-bold text-5xl">E</span>
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">How can I ease your day?</h2>
              <p className="text-slate-400 mb-10 max-w-md">
                Easing is your calm companion for daily life. Ask me anything, and I'll help you find focus and clarity.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {promptStarters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(starter.text);
                      // Auto-triggering is nice, but usually users want to see it in the box first
                      // Let's just set the input for them
                    }}
                    className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800/50 hover:border-slate-700 transition-all text-left group"
                  >
                    <span className="text-2xl">{starter.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400">{starter.label}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{starter.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 md:px-6">
              {activeThread.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isGenerating && activeThread.messages[activeThread.messages.length - 1].role === 'user' && (
                <div className="flex items-center gap-2 text-slate-500 text-sm ml-12 mb-6">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Easing is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative group">
            <form 
              onSubmit={handleSendMessage}
              className={`
                flex items-end gap-2 p-2 rounded-2xl bg-slate-900 border transition-all duration-200
                ${isGenerating ? 'border-slate-800' : 'border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30'}
                shadow-2xl shadow-black/50
              `}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Easing..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 py-3 px-3 resize-none max-h-[200px] text-base"
                rows={1}
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`
                  p-3 rounded-xl transition-all
                  ${!input.trim() || isGenerating 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20'}
                `}
              >
                {isGenerating ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </form>
            <div className="mt-2 text-center text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              Daily companion for a balanced life
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
