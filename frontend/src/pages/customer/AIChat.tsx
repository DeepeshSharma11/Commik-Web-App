import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, Bot, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../api';

const AIChat = () => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg, session_id: sessionId });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      setSessionId(res.data.session_id);
    } catch {
      toast.error('AI is currently offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    toast.success('New conversation started');
  };

  const suggestions = [
    'How to increase buffalo milk yield?',
    'Best feed for A2 milk production?',
    'Signs of illness in buffaloes?',
    'How to store raw milk properly?',
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">CommilK AI</h2>
            <p className="text-xs text-slate-400">Powered by RAG + Farm Data</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
        >
          <RotateCcw size={14} /> New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-sm"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
              <Bot size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Ask me anything about your farm!</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-sm">I have access to your farm data — buffaloes, milk logs, and health records. Ask me for personalized advice.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setChatInput(s); }}
                  className="text-left text-xs font-medium px-4 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-emerald-600" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Bot size={16} className="text-emerald-600" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400 ml-1">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={askAI} className="mt-4 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Ask about farm health, milk yield, feed..."
          className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
        />
        <button
          disabled={loading || !chatInput.trim()}
          type="submit"
          className="px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-lg transition flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default AIChat;
