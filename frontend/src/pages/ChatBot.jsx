import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatBot({ token }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello counselor. I am your AI Legal Assistant. You can ask me about IPC sections, legal precedents, or case evaluations.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/chat',
        { message: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      addToast('Failed to connect to AI Assistant', 'error');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Connection lost. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] animate-fade-in pb-4 flex flex-col">
      <div className="flex items-center gap-3 glass-panel p-4 rounded-t-xl border-b-0 border-[var(--border-color)]">
        <div className="bg-[var(--gold-primary)]/20 p-2 rounded-lg border border-[var(--gold-primary)]/30">
          <MessageSquare className="w-6 h-6 text-[var(--gold-primary)]" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">AI Legal Assistant</h2>
          <p className="text-xs text-[var(--text-secondary)]">Ask contextual questions about Indian Penal Code.</p>
        </div>
      </div>

      <div className="flex-1 glass-panel border-[var(--border-color)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--gold-primary)]/40">
                  <Bot size={16} className="text-[var(--gold-primary)]" />
                </div>
              )}
              <div className={`max-w-[75%] p-4 rounded-xl text-sm leading-relaxed ${m.role === 'user'
                  ? 'bg-[var(--gold-primary)] text-[var(--bg-primary)] font-medium rounded-tr-none'
                  : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none'
                }`}>
                {m.content.split('\n').map((line, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <User size={16} className="text-gray-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--gold-primary)]/40">
                <Bot size={16} className="text-[var(--gold-primary)]" />
              </div>
              <div className="p-4 rounded-xl text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--gold-primary)]" />
                <span className="text-[var(--text-secondary)] italic">Analyzing legal context...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              placeholder="E.g. What is the difference between Section 300 and Section 302?"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 pr-12 rounded-lg text-sm focus:border-[var(--gold-primary)] outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--gold-primary)] hover:bg-[var(--gold-secondary)] text-[var(--bg-primary)] rounded-md transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--text-secondary)]">AI Assistant can make mistakes. Verify critical legal information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
