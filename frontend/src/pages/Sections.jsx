import API_BASE from "../api";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { BookOpen, Search, ShieldAlert, Gavel, AlertTriangle } from 'lucide-react';

export default function Sections({ token }) {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sections`);
        setSections(res.data || {});
      } catch (err) {
        addToast("Failed to load sections reference", "error");
        setSections({});
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [token]);

  const filteredSections = Object.entries(sections).filter(([sec, data]) => {
    if (!data) return false;
    const term = searchTerm.toLowerCase();
    return sec.includes(term) ||
      (data.title && data.title.toLowerCase().includes(term)) ||
      (data.description && data.description.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3 glass-panel p-6 rounded-xl border-[var(--gold-primary)]/20 shadow-lg">
        <div className="bg-[var(--gold-primary)]/20 p-3 rounded-lg border border-[var(--gold-primary)]/30">
          <BookOpen className="w-8 h-8 text-[var(--gold-primary)]" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">IPC Reference Library</h2>
          <p className="text-sm text-[var(--text-secondary)]">Indian Penal Code Sections Reference Guide.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search section or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:border-[var(--gold-primary)] outline-none text-[var(--text-primary)]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center p-12 text-[var(--text-secondary)]">Loading reference material...</p>
        ) : filteredSections.length === 0 ? (
          <p className="text-center p-12 text-[var(--text-secondary)] border border-[var(--border-color)] border-dashed rounded-xl">No sections matched your search.</p>
        ) : (
          filteredSections.map(([sec, data], i) => (
            <div key={i} className="glass-panel p-6 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-colors flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-color)] w-24 h-24 rounded-lg flex-shrink-0">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-mono mb-1">Section</span>
                <span className="text-2xl font-bold text-[var(--gold-primary)]">{sec}</span>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{data.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{data.description}</p>
                </div>

                <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)] text-sm">
                  <div className="flex items-start gap-2">
                    <Gavel className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--text-primary)]"><span className="font-semibold text-rose-500">Punishment:</span> {data.punishment}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-color)]">
                  <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-[10px] uppercase rounded border border-blue-900/30 font-semibold">
                    {data.cognizable ? "Cognizable" : "Non-Cognizable"}
                  </span>
                  <span className={`px-2 py-1 text-[10px] uppercase rounded border font-semibold ${data.bailable ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-rose-900/20 text-rose-400 border-rose-900/30'}`}>
                    {data.bailable ? "Bailable" : "Non-Bailable"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
