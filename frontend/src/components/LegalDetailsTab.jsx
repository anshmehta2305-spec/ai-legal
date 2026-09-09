import React from 'react';
import { BookOpen, Scale, AlertTriangle, CheckCircle, Clock, ShieldAlert, FileText, Bookmark, Printer, Download, Copy, Share2, Gavel, ArrowRight } from 'lucide-react';

export default function LegalDetailsTab({ data }) {
  if (!data) return (
    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-secondary)]">
      <div className="w-12 h-12 border-4 border-[var(--gold-primary)]/30 border-t-[var(--gold-primary)] rounded-full animate-spin mb-4"></div>
      <p>Fetching legal intelligence...</p>
    </div>
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCitation = () => {
    if (data.precedents && data.precedents.length > 0) {
      navigator.clipboard.writeText(`${data.precedents[0].case_name}, ${data.precedents[0].citation}`);
      alert("Citation copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 legal-details-container">

      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gold-primary)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20 shadow-sm">
              {data.category}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm">
              {data.chapter}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--gold-primary)] tracking-tight">
            Section {data.section_number}: {data.section_name}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button onClick={handlePrint} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300" title="Print Details">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handleCopyCitation} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all duration-300" title="Copy Case Citation">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                <BookOpen className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Offence Description</h3>
            </div>
            <div className="bg-[var(--bg-secondary)]/40 rounded-r-xl border-l-[3px] border-[var(--gold-primary)] p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-[var(--gold-primary)]/10 to-transparent"></div>
              <p className="text-[var(--text-secondary)] leading-relaxed italic text-sm md:text-base relative z-10">
                "{data.offence_description}"
              </p>
            </div>
          </div>

          {/* BNS Mapping */}
          {data.bns_section && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                  <Scale className="w-5 h-5 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">BNS Mapping</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 font-semibold">Bharatiya Nyaya Sanhita Equivalent</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex-1 p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-slate-600 to-slate-400 opacity-50"></div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Legacy IPC</span>
                  <p className="font-serif font-bold text-2xl text-[var(--text-primary)]">Section {data.section_number}</p>
                </div>
                
                <div className="hidden md:flex shrink-0 text-[var(--border-color)] items-center justify-center">
                  <div className="w-8 h-[1px] bg-[var(--border-color)]"></div>
                  <ArrowRight className="w-5 h-5 mx-2 text-[var(--gold-primary)]/50" />
                  <div className="w-8 h-[1px] bg-[var(--border-color)]"></div>
                </div>
                
                <div className="flex-1 p-5 rounded-xl border border-[var(--gold-primary)]/30 bg-[var(--gold-primary)]/[0.03] flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(212,175,55,0.03)]">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--gold-primary)] to-amber-200 opacity-80"></div>
                  <span className="text-[10px] font-bold text-[var(--gold-primary)] tracking-widest uppercase mb-2 flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold-primary)] opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--gold-primary)]"></span>
                    </span>
                    Active BNS
                  </span>
                  <p className="font-serif font-bold text-2xl text-white">Section {data.bns_section}</p>
                </div>
              </div>
              <p className="mt-5 text-sm text-[var(--text-secondary)] text-center max-w-xl mx-auto leading-relaxed">{data.bns_description}</p>
            </div>
          )}

          {/* Legal Classification */}
          {data.classification && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                  <ShieldAlert className="w-5 h-5 text-[var(--gold-primary)]" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Classification Overview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-start p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mb-2 font-bold">Nature</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-md ${data.classification.is_cognizable ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {data.classification.is_cognizable ? 'Cognizable' : 'Non-Cognizable'}
                  </span>
                </div>
                <div className="flex flex-col items-start p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mb-2 font-bold">Bail</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-md ${data.classification.is_bailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {data.classification.is_bailable ? 'Bailable' : 'Non-Bailable'}
                  </span>
                </div>
                <div className="flex flex-col items-start p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mb-2 font-bold">Compromise</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-md ${data.classification.is_compoundable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {data.classification.is_compoundable ? 'Compoundable' : 'Non-Compoundable'}
                  </span>
                </div>
                <div className="flex flex-col items-start p-4 rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest mb-2 font-bold">Triable By</span>
                  <p className="font-medium text-[var(--text-primary)] text-sm leading-tight">{data.classification.triable_by}</p>
                </div>
              </div>
            </div>
          )}

          {/* Punishment info */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-amber-500/30 transition-colors group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                <Gavel className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Punishment Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border-color)] md:col-span-2 flex flex-col justify-center">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-2">Imprisonment Term</span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xl font-serif font-medium text-[var(--text-primary)]">{data.min_punishment}</span>
                  <span className="text-[var(--text-secondary)] text-sm italic">to</span>
                  <span className="text-xl font-serif font-medium text-[var(--text-primary)]">{data.max_punishment}</span>
                </div>
              </div>
              <div className="p-5 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-2 block">Nature of Imprisonment</span>
                <p className="font-medium text-[var(--text-primary)]">{data.imprisonment_type}</p>
              </div>
              <div className="p-5 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-2 block">Fine Amount</span>
                <p className="font-medium text-[var(--text-primary)]">{data.fine_amount}</p>
              </div>
            </div>
          </div>

          {/* Essential Ingredients */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                <CheckCircle className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Essential Ingredients of Offence</h3>
            </div>
            <div className="bg-[var(--bg-secondary)]/20 rounded-xl border border-[var(--border-color)] p-2">
              <ul className="divide-y divide-[var(--border-color)]/50">
                {data.elements?.map((element, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 hover:bg-[var(--bg-secondary)]/60 transition-colors rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-bold shrink-0 mt-0.5 border border-[var(--gold-primary)]/20">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-[var(--text-primary)] leading-relaxed">{element}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Procedure Timeline */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                <Clock className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Investigation Procedure</h3>
            </div>
            <div className="space-y-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--gold-primary)]/40 via-[var(--border-color)] to-transparent"></div>
              
              {data.procedure?.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-6 group/step">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-[var(--card-bg)] bg-[var(--bg-secondary)] group-hover/step:bg-[var(--gold-primary)] text-[var(--text-secondary)] group-hover/step:text-black font-bold shadow-sm shrink-0 z-10 transition-all duration-300">
                    {idx + 1}
                  </div>
                  <div className="flex-1 p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 shadow-sm group-hover/step:border-[var(--gold-primary)]/40 group-hover/step:bg-[var(--bg-secondary)]/60 transition-colors">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Precedents */}
          {data.precedents && data.precedents.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/30 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                  <Bookmark className="w-5 h-5 text-[var(--gold-primary)]" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Supreme Court Judgments</h3>
              </div>
              <div className="space-y-4">
                {data.precedents.map((p, idx) => (
                  <div key={idx} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-serif font-bold text-lg text-[var(--text-primary)]">{p.case_name}</h4>
                      <span className="text-xs font-bold px-2.5 py-1 bg-[var(--card-bg)] rounded-md border border-[var(--border-color)] text-[var(--gold-primary)] shrink-0 ml-4 shadow-sm">{p.year}</span>
                    </div>
                    <p className="text-xs font-mono text-[var(--text-secondary)] mb-4 bg-[var(--card-bg)] inline-block px-2.5 py-1 rounded-md border border-[var(--border-color)]">{p.citation}</p>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-5">{p.summary}</p>
                    <div className="p-4 bg-[var(--gold-primary)]/[0.03] border border-[var(--gold-primary)]/10 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gold-primary)]/50"></div>
                      <p className="text-sm font-medium text-[var(--text-primary)] italic">
                        <span className="text-[var(--gold-primary)] not-italic font-bold mr-2 uppercase tracking-widest text-[10px]">Key Principle</span>
                        <br/>
                        {p.key_principle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">

          {/* AI Analysis Panel */}
          <div className="bg-[var(--card-bg)] border border-[var(--gold-primary)]/20 rounded-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative">
            {/* Subtle Ethereal Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--gold-primary)]/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 bg-[var(--gold-primary)]/10 rounded-lg border border-[var(--gold-primary)]/20">
                      <ShieldAlert className="w-5 h-5 text-[var(--gold-primary)] relative z-10" />
                    </div>
                    <div className="absolute inset-0 bg-[var(--gold-primary)] blur-md opacity-30"></div>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">AI Legal Analysis</h3>
                </div>
                <div className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30">
                  Beta
                </div>
              </div>
              
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                {data.ai_explanation}
              </p>

              <div className="mb-7 bg-[var(--bg-secondary)]/50 p-5 rounded-xl border border-[var(--border-color)]">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">Severity Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-[var(--text-primary)] leading-none">{data.ai_severity_score}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-medium">/10</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[var(--card-bg)] rounded-full overflow-hidden shadow-inner border border-[var(--border-color)]">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${data.ai_severity_score >= 8 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : data.ai_severity_score >= 5 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                    style={{ width: `${data.ai_severity_score * 10}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-5 border-t border-[var(--border-color)]">
                <h4 className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-4">Recommended Action Plan</h4>
                <ul className="space-y-3">
                  {data.ai_next_steps?.map((step, idx) => (
                    <li key={idx} className="text-sm flex gap-3 items-start group/step">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--gold-primary)] shrink-0 mt-0.5 text-xs group-hover/step:border-[var(--gold-primary)]/40 transition-colors shadow-sm">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      <span className="text-[var(--text-primary)] leading-relaxed text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Related Sections */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm hover:border-[var(--gold-primary)]/20 transition-colors">
            <h3 className="text-[10px] font-bold mb-4 uppercase tracking-widest text-[var(--text-secondary)]">Related Sections</h3>
            <div className="flex flex-wrap gap-2">
              {data.related_sections?.map((sec, idx) => (
                <button key={idx} className="px-3.5 py-1.5 bg-[var(--bg-secondary)]/50 hover:bg-[var(--gold-primary)]/10 hover:text-[var(--gold-primary)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/30 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 shadow-sm">
                  {sec}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
