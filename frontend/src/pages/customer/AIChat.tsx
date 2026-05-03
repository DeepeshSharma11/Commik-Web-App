import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RotateCcw, Bot, User, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context';
import MarkdownMessage from '../../components/MarkdownMessage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const SUGGESTIONS = [
  'How to increase buffalo milk yield?',
  'Best feed for A2 milk production?',
  'Signs of illness in buffaloes?',
  'How to store raw milk properly?',
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

const AIChat = () => {
  const { token } = useAuth();
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const askAI = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || streaming) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setStreaming(true);

    // Add empty assistant bubble that will be filled token by token
    setMessages(prev => [...prev, { role: 'assistant', text: '', streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const resp = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg, session_id: sessionId }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error('Stream failed');

      const reader  = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'session') {
              setSessionId(data.session_id);
            } else if (data.type === 'token') {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, text: last.text + data.token };
                }
                return copy;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, streaming: false };
                }
                return copy;
              });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error('AI is offline or stream failed. Try again.');
      // Remove empty assistant bubble on error
      setMessages(prev => prev.filter((_, i) => !(i === prev.length - 1 && prev[i].text === '')));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, sessionId, token]);

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    toast.success('New conversation started');
  };

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
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Zap size={10} className="text-amber-400" /> Real-time · RAG · Farm Data
            </p>
          </div>
        </div>
        <button onClick={handleNewChat}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
          <RotateCcw size={14} /> New Chat
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-sm">

        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
              <Bot size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Ask me anything about your farm!</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-sm">
              I have access to your farm data — buffaloes, milk logs, and health records. I respond in real-time.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="text-left text-xs font-medium px-4 py-3 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-600 transition">
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
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
            }`}>
              {msg.role === 'user'
                ? <span className="whitespace-pre-wrap">{msg.text}</span>
                : <MarkdownMessage text={msg.text} />}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={askAI} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about farm health, milk yield, feed..."
          disabled={streaming}
          className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm disabled:opacity-60"
        />
        <button disabled={streaming || !input.trim()} type="submit"
          className="px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-lg transition flex items-center justify-center">
          {streaming
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default AIChat;
