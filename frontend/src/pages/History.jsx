import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { History as HistoryIcon, Search, ChevronRight, X, Bookmark, Target, Calendar, Download, FileText, Save, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function History({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        addToast("Failed to load history", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      setNotes(selectedItem.notes || '');
      setIsEditingNotes(false);
    }
  }, [selectedItem]);

  const handleUpdateHistory = async (isBookmarked = null) => {
    if (!selectedItem) return;
    setUpdating(true);
    const updatedBookmark = isBookmarked !== null ? isBookmarked : selectedItem.is_bookmarked;

    try {
      await axios.put(`http://127.0.0.1:8000/api/history/${selectedItem.id}`, {
        is_bookmarked: updatedBookmark,
        tags: selectedItem.tags || '',
        notes: notes
      }, { headers: { Authorization: `Bearer ${token}` } });

      const updatedItem = { ...selectedItem, is_bookmarked: updatedBookmark, notes };
      setSelectedItem(updatedItem);
      setHistory(history.map(h => h.id === selectedItem.id ? updatedItem : h));
      addToast('History updated', 'success');
      setIsEditingNotes(false);
    } catch (err) {
      addToast('Failed to update history', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = () => {
    if (history.length === 0) return addToast('No data to export', 'error');
    const headers = ['Date', 'Section', 'Confidence', 'Description', 'Notes', 'Bookmarked'];
    const rows = history.map(h => [
      new Date(h.timestamp).toLocaleDateString(),
      h.predicted_section,
      h.confidence_score.toFixed(2),
      `"${h.case_description.replace(/"/g, '""')}"`,
      `"${h.notes ? h.notes.replace(/"/g, '""') : ''}"`,
      h.is_bookmarked ? 'Yes' : 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prediction_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportPDF = () => {
    if (history.length === 0) return addToast('No data to export', 'error');
    const doc = new jsPDF();
    doc.text("Prediction History Report", 14, 15);

    const tableData = history.map(h => [
      new Date(h.timestamp).toLocaleDateString(),
      h.predicted_section,
      h.confidence_score.toFixed(2) + "%",
      h.case_description.substring(0, 50) + "..."
    ]);

    doc.autoTable({
      head: [['Date', 'Predicted Section', 'Confidence', 'Description']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [212, 175, 55] } // legal-gold
    });

    doc.save("prediction_history.pdf");
  };

  const filteredHistory = history.filter(h =>
    h.case_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.predicted_section.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto flex h-[calc(100vh-6rem)] gap-6 animate-fade-in relative">
      {/* Left List */}
      <div className={`flex-1 glass-panel rounded-xl shadow-lg border-[var(--gold-primary)]/20 flex flex-col transition-all duration-300 ${selectedItem ? 'hidden md:flex md:w-1/3' : 'w-full'}`}>
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-[var(--gold-primary)]" />
              History
            </h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--gold-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] rounded-lg transition-colors border border-[var(--border-color)]" title="Export to CSV">
                <FileText className="w-4 h-4" />
              </button>
              <button onClick={exportPDF} className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--gold-primary)]/10 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] rounded-lg transition-colors border border-[var(--border-color)]" title="Export to PDF">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search descriptions or sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:border-[var(--gold-primary)] outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <p className="text-center p-8 text-[var(--text-secondary)]">Loading history...</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-center p-8 text-[var(--text-secondary)]">No history found.</p>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 mb-2 rounded-lg cursor-pointer transition-all border ${selectedItem?.id === item.id ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]' : 'bg-transparent border-transparent hover:bg-[var(--bg-primary)] hover:border-[var(--border-color)]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-[var(--gold-primary)]">Section {item.predicted_section}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.case_description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Details Panel (Slide-in) */}
      {selectedItem && (
        <div className="flex-[2] glass-panel rounded-xl shadow-lg border-[var(--gold-primary)]/40 flex flex-col animate-slide-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold-primary)]/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)]/20 flex items-center justify-center text-[var(--gold-primary)]">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Section {selectedItem.predicted_section}</h3>
                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Calendar size={12} /> {new Date(selectedItem.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleUpdateHistory(!selectedItem.is_bookmarked)} disabled={updating} className={`p-2 rounded-full transition-colors ${selectedItem.is_bookmarked ? 'bg-[var(--gold-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)]'}`} title={selectedItem.is_bookmarked ? "Remove Bookmark" : "Bookmark this case"}>
                <Bookmark size={20} className={selectedItem.is_bookmarked ? 'fill-current' : ''} />
              </button>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Confidence Score</p>
                <p className="text-2xl font-bold text-green-400">{(selectedItem.confidence_score).toFixed(2)}%</p>
              </div>
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                <p className="text-xs text-[var(--text-secondary)] uppercase mb-1">Model Used</p>
                <p className="text-sm font-semibold">{selectedItem.model_used}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase text-[var(--text-secondary)] mb-2">Original Case Description</h4>
              <div className="p-4 bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {selectedItem.case_description}
              </div>
            </div>

            {selectedItem.all_predictions && selectedItem.all_predictions.length > 0 && (
              <div>
                <h4 className="text-xs font-mono uppercase text-[var(--text-secondary)] mb-2">Top 3 Alternatives</h4>
                <div className="space-y-2">
                  {selectedItem.all_predictions.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm">
                      <span>Section {p.section}</span>
                      <span className="font-mono text-xs">{p.confidence.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="mt-6 border-t border-[var(--border-color)] pt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-mono uppercase text-[var(--text-secondary)]">Case Notes</h4>
                {!isEditingNotes ? (
                  <button onClick={() => setIsEditingNotes(true)} className="text-[var(--gold-primary)] flex items-center gap-1 text-xs hover:underline">
                    <Edit2 className="w-3 h-3" /> Edit Notes
                  </button>
                ) : (
                  <button onClick={() => handleUpdateHistory()} disabled={updating} className="text-green-500 flex items-center gap-1 text-xs hover:underline">
                    <Save className="w-3 h-3" /> Save Notes
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-32 p-3 bg-[var(--bg-primary)] border border-[var(--gold-primary)]/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--gold-primary)] resize-none"
                  placeholder="Add your notes or tags here..."
                ></textarea>
              ) : (
                <div className="p-4 bg-[var(--bg-primary)]/30 border border-[var(--border-color)] rounded-lg text-sm min-h-[5rem] text-[var(--text-secondary)]">
                  {notes ? <span className="whitespace-pre-wrap">{notes}</span> : <span className="italic opacity-50">No notes added yet.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
