import React, { useState, useEffect, useRef } from 'react';
import { Search, History, MessageSquare, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/search?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, token]);

  const handleSelect = (item) => {
    setIsOpen(false);
    if (item.type === 'Prediction') {
      navigate('/history');
    } else if (item.type === 'Chat') {
      navigate('/chatbot');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      <div className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--gold-primary)]/30 rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
        <div className="flex items-center p-4 border-b border-[var(--border-color)]">
          <Search className="w-5 h-5 text-[var(--text-secondary)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            placeholder="Search predictions, chats, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {loading && <div className="p-4 text-center text-[var(--text-secondary)] text-sm animate-pulse">Searching...</div>}
          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-[var(--text-secondary)] text-sm">No results found for "{query}"</div>
          )}
          {!loading && results.map((item, idx) => (
            <div
              key={`${item.type}-${item.id}-${idx}`}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-4 p-3 hover:bg-[var(--bg-secondary)]/50 rounded-xl cursor-pointer transition-colors"
            >
              <div className={`p-2 rounded-lg ${item.type === 'Prediction' ? 'bg-[var(--gold-primary)]/20 text-[var(--gold-primary)]' : 'bg-blue-500/20 text-blue-500'}`}>
                {item.type === 'Prediction' ? <History className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.title}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-mono uppercase text-[var(--text-secondary)]">{item.type}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {!query && (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-2">Type to search across your workspace</p>
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] opacity-50">
                <kbd className="px-2 py-1 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)]">Ctrl</kbd> +
                <kbd className="px-2 py-1 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)]">K</kbd> to open
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
