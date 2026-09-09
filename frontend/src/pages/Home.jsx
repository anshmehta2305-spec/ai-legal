import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowRight, Gavel, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Home({ token }) {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-legal-gold/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-950/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Hero Section */}
      <div className="text-center space-y-6 relative z-10 flex flex-col items-center">
        <div className="animate-float inline-flex items-center justify-center p-5 bg-legal-dark border border-legal-gold/20 rounded-full shadow-2xl mb-2">
          <Scale className="w-16 h-16 text-legal-gold" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          AI Legal <span className="text-transparent bg-clip-text bg-gradient-to-r from-legal-gold via-legal-goldLight to-legal-goldDark">Text Clustering</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl font-light mx-auto leading-relaxed">
          An advanced machine learning framework for classifying Indian legal case studies and narratives into relevant IPC Sections.
        </p>

        <div className="pt-4">
          <button
            onClick={handleCTA}
            className="group flex items-center gap-2 bg-gradient-to-r from-legal-gold to-legal-goldDark hover:from-legal-goldLight hover:to-legal-gold text-legal-darker font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-legal-gold/20 hover:scale-105 transition-all duration-300"
          >
            <span>{token ? 'Go to Dashboard' : 'Get Started'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Abstract Panel */}
      <div className="mt-16 w-full glass p-8 md:p-10 rounded-2xl shadow-2xl relative z-10">
        <h2 className="text-2xl font-serif font-semibold text-legal-gold mb-4 flex items-center gap-2.5">
          <FileText className="w-6 h-6" />
          <span>Project Abstract</span>
        </h2>
        <div className="text-[var(--text-secondary)] space-y-4 font-sans text-sm md:text-base leading-relaxed">
          <p>
            The classification of unstructured judicial narratives into appropriate law categories is a labor-intensive challenge. Traditional legal workflows rely on manual case interpretation, which creates high processing times and increases judicial case backlogs in Indian courts.
          </p>
          <p>
            <strong>LexClassify (AI Legal Text Clustering)</strong> addresses this bottleneck by deploying Natural Language Processing (NLP) and supervised Machine Learning classifiers. This system processes raw Indian Penal Code (IPC) case study descriptions, applies text-cleaning pipelines (stop-word removal, lemmatization, tokenization), and extracts mathematical representations using Term Frequency-Inverse Document Frequency (TF-IDF).
          </p>
          <p>
            We evaluate and compare five leading machine learning architectures: <strong>K-Nearest Neighbors (KNN), Linear Support Vector Machines (SVM), Decision Trees, Random Forests,</strong> and <strong>Extra Trees Classifiers</strong> to predict legal section categories automatically. The system achieves high accuracy, providing legal professionals with automated statutory mapping.
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full relative z-10">
        <div className="glass p-6 rounded-xl hover:border-legal-gold/40 transition-colors duration-200">
          <Gavel className="w-8 h-8 text-legal-gold mb-3" />
          <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] mb-2">IPC Statutory Mapping</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Classifies descriptions into key sections such as Section 300 (Murder), 307 (Attempt to Murder), 420 (Cheating), 498A (Cruelty), and more.
          </p>
        </div>

        <div className="glass p-6 rounded-xl hover:border-legal-gold/40 transition-colors duration-200">
          <CheckCircle2 className="w-8 h-8 text-legal-gold mb-3" />
          <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] mb-2">Multi-Model Framework</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Evaluates prediction outputs across five machine learning algorithms in parallel to identify the most robust decision boundaries.
          </p>
        </div>

        <div className="glass p-6 rounded-xl hover:border-legal-gold/40 transition-colors duration-200">
          <ShieldCheck className="w-8 h-8 text-legal-gold mb-3" />
          <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] mb-2">Advanced NLP Pipeline</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Utilizes custom NLTK tokenization, punctuation filtering, stop-word removal, and WordNet lemmatization for optimal TF-IDF vector extraction.
          </p>
        </div>
      </div>
    </div>
  );
}
