import API_BASE from "../api";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Scale, Brain, MessageSquare, Send, CheckCircle, FileText, BarChart3, AlertTriangle, ShieldCheck, Loader2,
  UploadCloud, Languages, Sparkles, Clock, FileKey, Target, FileSignature, FileArchive
} from 'lucide-react';
import LegalDetailsTab from '../components/LegalDetailsTab';

const ipcDescriptions = {
  "300": "Section 300 - Murder: Culpable homicide amounting to murder.",
  "302": "Section 302 - Punishment for Murder: Imprisonment for life or death sentence.",
  "307": "Section 307 - Attempt to Murder: Commission of an act with intention to kill.",
  "376": "Section 376 - Punishment for Rape: Sexual intercourse without consent.",
  "420": "Section 420 - Cheating: Deceiving and dishonestly inducing delivery of property.",
  "401": "Section 401 - Gang of Thieves: Belonging to a group committing theft/robbery.",
  "498A": "Section 498A - Cruelty by Husband/Relatives: Physical or mental cruelty regarding dowry."
};

export default function Dashboard({ token, user }) {
  const { addToast } = useToast();
  const [model, setModel] = useState('Extra Trees Classifier');
  const [caseDescription, setCaseDescription] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // New State variables
  const [summarizeFirst, setSummarizeFirst] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [tabData, setTabData] = useState({
    explanation: null,
    similarCases: null,
    recommendations: null,
    timeline: null,
    fir: null,
    legal: null
  });
  const [loadingTabs, setLoadingTabs] = useState({});
  const [language, setLanguage] = useState('en');
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(response.data);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };
    fetchMetrics();
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActivities(response.data.activity);
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [token]);

  // Handle Drag & Drop
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    addToast(`Uploading ${files.length} document(s)...`, 'info');

    try {
      let aggregatedText = caseDescription ? caseDescription + "\\n\\n" : "";

      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`${API_BASE}/api/upload/document`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      });

      const results = await Promise.all(uploadPromises);

      results.forEach(res => {
        aggregatedText += `--- [Document: ${res.data.filename}] ---\\n`;
        aggregatedText += res.data.extracted_text + "\\n\\n";
      });

      setCaseDescription(aggregatedText);
      addToast(`Successfully extracted text from ${files.length} document(s)`, 'success');
    } catch (err) {
      addToast('One or more document extractions failed', 'error');
    } finally {
      setUploading(false);
    }
  };
  const handlePredict = async (e) => {
    e.preventDefault();
    setPrediction(null);
    setTabData({ explanation: null, similarCases: null, recommendations: null, timeline: null, fir: null, legal: null });
    setActiveTab('results');

    if (!caseDescription.trim()) {
      addToast("Please enter a case study or upload a document.", "warning");
      return;
    }

    setLoading(true);
    let finalDescription = caseDescription;

    try {
      if (summarizeFirst) {
        addToast('Summarizing input text...', 'info');
        const sumRes = await axios.post(`${API_BASE}/api/summarize`, { case_description: finalDescription }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        finalDescription = sumRes.data.summary;
        addToast('Summarization complete', 'success');
      }

      const response = await axios.post(`${API_BASE}/api/predict`,
        { model_name: model, case_description: finalDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPrediction(response.data);
      addToast('Prediction successful', 'success');

      // Auto-fetch related tab data sequentially or lazily when clicked. Let's do lazy load for tabs to save bandwidth.
    } catch (err) {
      addToast(err.response?.data?.detail || 'Prediction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tabName) => {
    if (tabData[tabName] || !prediction || loadingTabs[tabName]) return;

    setLoadingTabs(prev => ({ ...prev, [tabName]: true }));
    try {
      let res;
      switch (tabName) {
        case 'explanation':
          res = await axios.post(`${API_BASE}/api/explain`,
            { case_description: caseDescription, model_name: model, predicted_section: prediction.primary_prediction.section },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case 'similarCases':
          res = await axios.post(`${API_BASE}/api/similar-cases`,
            { case_description: caseDescription, top_n: 3 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case 'recommendations':
          res = await axios.get(`${API_BASE}/api/recommendations/${prediction.primary_prediction.section}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case 'timeline':
          res = await axios.post(`${API_BASE}/api/generate-timeline`,
            { case_description: caseDescription },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case 'fir':
          res = await axios.post(`${API_BASE}/api/generate-fir`,
            {
              case_description: caseDescription,
              complainant_name: user?.name || "John Doe",
              complainant_address: "Address",
              complainant_mobile: "0000000000",
              incident_date: "Unknown",
              incident_location: "Unknown",
              accused_description: "Unknown",
              predicted_section: prediction.primary_prediction.section
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case 'legal':
          res = await axios.get(`${API_BASE}/api/legal-sections/${prediction.primary_prediction.section}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        default: return;
      }
      setTabData(prev => ({ ...prev, [tabName]: res.data }));
    } catch (err) {
      addToast(`Failed to load ${tabName}`, 'error');
    } finally {
      setLoadingTabs(prev => ({ ...prev, [tabName]: false }));
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const selectedMetrics = metrics ? metrics[model] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-xl shadow-lg border-[var(--gold-primary)]/20">
        <div>
          <h2 className="text-2xl font-serif font-bold">Prediction Dashboard</h2>
          <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5 font-light">Welcome back, {user?.name || user?.email}</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-[var(--gold-primary)]" />
          <span className="text-[var(--text-secondary)]">Authenticated:</span>
          <span className="text-[var(--gold-primary)] font-semibold">{user?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl shadow-xl space-y-5">
            <h3 className="text-lg font-serif font-semibold border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--gold-primary)]" />
              <span>Input Details</span>
            </h3>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="model-select">Algorithm</label>
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="Extra Trees Classifier">Extra Trees Classifier (Recommended)</option>
                <option value="Random Forest">Random Forest Classifier</option>
                <option value="Linear SVM">Linear Support Vector Machine (SVM)</option>
                <option value="Decision Tree">Decision Tree Classifier</option>
                <option value="K-Nearest Neighbors">K-Nearest Neighbors (KNN)</option>
              </select>
            </div>

            {/* File Upload / Drag & Drop */}
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5">Document Upload</label>
              <div
                className={`border-2 border-dashed ${isDragActive ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10' : 'border-[var(--border-color)] bg-[var(--bg-primary)]/50'} hover:border-[var(--gold-primary)] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors`}
                onClick={() => fileInputRef.current.click()}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); handleFileUpload(Array.from(e.dataTransfer.files)); }}
              >
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[var(--gold-primary)] mb-2" /> : <UploadCloud className="w-6 h-6 text-[var(--gold-primary)] mb-2" />}
                <span className="text-xs text-[var(--text-secondary)]">Drop PDF/DOCX/IMG or click to upload</span>
                <input type="file" multiple ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(Array.from(e.target.files))} />
              </div>
            </div>

            {/* AI Toggles */}
            <div className="flex items-center justify-between border border-[var(--border-color)] p-3 rounded-lg bg-[var(--bg-primary)]/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Summarize First</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={summarizeFirst} onChange={() => setSummarizeFirst(!summarizeFirst)} />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--gold-primary)]"></div>
              </label>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="description">Case Description</label>
              <textarea
                id="description"
                rows="8"
                placeholder="Paste case details..."
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] p-4 rounded-lg text-sm outline-none font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--gold-primary)] hover:bg-[var(--gold-secondary)] text-[var(--bg-primary)] font-bold py-3.5 rounded-lg shadow-md cursor-pointer transition-all duration-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Processing...' : 'Predict Statutory Section'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Output */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <div className="glass-panel rounded-xl shadow-xl overflow-hidden flex flex-col h-full border border-[var(--gold-primary)]/30">

              {/* Tab Navigation */}
              <div className="flex border-b border-[var(--border-color)] overflow-x-auto custom-scrollbar bg-[var(--bg-primary)]/50">
                {[
                  { id: 'results', icon: Target, label: 'Results' },
                  { id: 'legal', icon: Scale, label: 'Legal Details' },
                  { id: 'explanation', icon: Brain, label: 'Explanation' },
                  { id: 'similarCases', icon: FileKey, label: 'Similar Cases' },
                  { id: 'timeline', icon: Clock, label: 'Timeline' },
                  { id: 'recommendations', icon: ShieldCheck, label: 'Action Plan' },
                  { id: 'fir', icon: FileSignature, label: 'Generate FIR' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSwitch(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2
                      ${activeTab === tab.id
                        ? 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[var(--gold-primary)]/5'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Area */}
              <div className="p-6 flex-1 min-h-[400px]">
                {activeTab === 'results' && (
                  <div className="space-y-6 animate-slide-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-mono text-[var(--gold-secondary)] uppercase tracking-widest mb-1">Primary Prediction</h3>
                        <div className="text-4xl font-serif font-bold text-[var(--gold-primary)] text-gold-glow">
                          IPC Section {prediction.primary_prediction.section}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Confidence</span>
                        <div className="text-2xl font-bold text-green-400">
                          {prediction.primary_prediction.confidence.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {ipcDescriptions[prediction.primary_prediction.section] || "Statutory description not mapped."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-mono uppercase text-[var(--text-secondary)] mb-3">Live Confidence Meter (Top 3)</h4>
                      <div className="space-y-3">
                        {prediction.all_predictions.map((p, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Section {p.section}</span>
                              <span>{p.confidence.toFixed(2)}%</span>
                            </div>
                            <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                              <div
                                className="bg-[var(--gold-primary)] h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${p.confidence}%`, opacity: 1 - (i * 0.3) }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'explanation' && (
                  <div className="animate-slide-in h-full">
                    {loadingTabs['explanation'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Generating XAI explanation...</div>
                    ) : tabData.explanation ? (
                      <div className="space-y-4">
                        <h3 className="font-serif text-lg text-[var(--gold-primary)]">AI Reasoning</h3>
                        <p className="text-sm leading-relaxed">{tabData.explanation.explanation}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {tabData.explanation.keywords.map(kw => (
                            <span key={kw} className="px-3 py-1 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30 rounded-full text-xs">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : <p className="text-sm text-[var(--text-secondary)]">No explanation available.</p>}
                  </div>
                )}

                {activeTab === 'similarCases' && (
                  <div className="animate-slide-in h-full">
                    {loadingTabs['similarCases'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Searching 1000+ precedents...</div>
                    ) : tabData.similarCases ? (
                      <div className="space-y-4 h-[350px] overflow-y-auto custom-scrollbar pr-2">
                        {tabData.similarCases.similar_cases.map((c, i) => (
                          <div key={i} className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:border-[var(--gold-primary)]/50 transition-colors">
                            <div className="flex justify-between mb-2">
                              <span className="font-bold text-[var(--gold-primary)]">Section {c.section}</span>
                              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">Match: {c.similarity_score.toFixed(2)}%</span>
                            </div>
                            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-[var(--text-secondary)]">No similar cases found.</p>}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="animate-slide-in h-full">
                    {loadingTabs['timeline'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Extracting chronological events...</div>
                    ) : tabData.timeline ? (
                      <div className="relative border-l-2 border-[var(--gold-primary)]/30 ml-4 space-y-6 mt-4">
                        {tabData.timeline.timeline.map((evt, i) => (
                          <div key={i} className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-[var(--gold-primary)] rounded-full -left-[7px] top-1"></div>
                            <div className="font-bold text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] inline-block px-2 py-1 rounded border border-[var(--border-color)] mb-2">{evt.date}</div>
                            <p className="text-xs text-[var(--text-secondary)] italic">"{evt.context}"</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="animate-slide-in h-full">
                    {loadingTabs['recommendations'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Fetching action plan...</div>
                    ) : tabData.recommendations ? (
                      <ul className="space-y-3">
                        {tabData.recommendations.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}

                {activeTab === 'legal' && (
                  <div className="animate-slide-in h-full">
                    {loadingTabs['legal'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Fetching legal intelligence...</div>
                    ) : tabData.legal ? (
                      <LegalDetailsTab data={tabData.legal} />
                    ) : <p className="text-sm text-[var(--text-secondary)]">No legal details available for this section.</p>}
                  </div>
                )}

                {activeTab === 'fir' && (
                  <div className="animate-slide-in h-full flex flex-col">
                    {loadingTabs['fir'] ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]"><Loader2 className="animate-spin mb-2" />Drafting formal document...</div>
                    ) : tabData.fir ? (
                      <>
                        <div className="bg-[#fdfbf7] text-[#2c1e16] font-mono p-6 rounded text-xs whitespace-pre-wrap overflow-y-auto custom-scrollbar flex-1 border border-gray-300 shadow-inner">
                          {tabData.fir.fir_text}
                        </div>
                        <button className="mt-4 w-full py-2 bg-[var(--bg-primary)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-sm rounded flex items-center justify-center gap-2 transition-colors">
                          <FileArchive className="w-4 h-4 text-[var(--gold-primary)]" /> Download as PDF
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border border-[var(--border-color)] border-dashed">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-primary)] flex items-center justify-center mb-4">
                <Scale className="w-10 h-10 text-[var(--text-secondary)] opacity-50" />
              </div>
              <h3 className="text-xl font-serif text-[var(--text-secondary)]">Awaiting Case Input</h3>
              <p className="text-sm text-[var(--text-secondary)]/70 max-w-md mt-2">
                Enter details on the left to activate the AI analysis suite, including Explainability, Similar Cases, and Timelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
