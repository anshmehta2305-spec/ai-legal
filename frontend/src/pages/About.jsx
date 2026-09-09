import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Scale, Database, Cpu, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const fallbackChartData = [
  { name: 'KNN', Accuracy: 82.5 },
  { name: 'Linear SVM', Accuracy: 89.0 },
  { name: 'Decision Tree', Accuracy: 78.5 },
  { name: 'Random Forest', Accuracy: 90.5 },
  { name: 'Extra Trees', Accuracy: 92.5 }
];

export default function About({ token }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!token) {
      setChartData(fallbackChartData);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const apiData = response.data;
        const formattedData = [
          { name: 'KNN', Accuracy: parseFloat((apiData['K-Nearest Neighbors'].accuracy * 100).toFixed(2)) },
          { name: 'Linear SVM', Accuracy: parseFloat((apiData['Linear SVM'].accuracy * 100).toFixed(2)) },
          { name: 'Decision Tree', Accuracy: parseFloat((apiData['Decision Tree'].accuracy * 100).toFixed(2)) },
          { name: 'Random Forest', Accuracy: parseFloat((apiData['Random Forest'].accuracy * 100).toFixed(2)) },
          { name: 'Extra Trees', Accuracy: parseFloat((apiData['Extra Trees Classifier'].accuracy * 100).toFixed(2)) }
        ];
        setChartData(formattedData);
      } catch (err) {
        console.error("Error fetching live metrics, using fallback", err);
        setChartData(fallbackChartData);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">Project Methodology & Evaluation</h2>
        <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">Comparing architectures and NLP pipelines evaluated in the academic paper</p>
      </div>

      {/* Accuracy Chart Section */}
      <div className="glass-panel p-6 rounded-xl shadow-xl space-y-4 border border-[var(--border-color)]">
        <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[var(--gold-primary)]" />
          <span>Model Accuracy Comparison (%)</span>
        </h3>

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gold-primary)]" />
            <p className="text-xs text-[var(--text-secondary)] font-sans">Calculating live metrics from backend...</p>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Accuracy" fill="var(--gold-primary)" radius={[4, 4, 0, 0]} barSize={45} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ML Models comparative study */}
      <div className="glass-panel p-6 rounded-xl shadow-xl space-y-4 overflow-hidden border border-[var(--border-color)]">
        <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[var(--gold-primary)]" />
          <span>Machine Learning Models Comparative Study</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--gold-primary)] font-mono uppercase">
                <th className="py-3 px-4 font-semibold">Model</th>
                <th className="py-3 px-4 font-semibold">Methodology</th>
                <th className="py-3 px-4 font-semibold">Pros</th>
                <th className="py-3 px-4 font-semibold">Cons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Support Vector Machine (SVM)</td>
                <td className="py-4 px-4">SVM finds the hyperplane that best separates classes in high-dimensional space.</td>
                <td className="py-4 px-4 text-green-500">Effective in high-dimensional spaces, works well for non-linear data with the right kernel.</td>
                <td className="py-4 px-4 text-rose-500">Memory-intensive, slow to train on large datasets, sensitive to noisy data.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">K-Nearest Neighbors (KNN)</td>
                <td className="py-4 px-4">KNN classifies a data point based on the majority vote of its k nearest neighbors.</td>
                <td className="py-4 px-4 text-green-500">Simple to implement, works well with small datasets, no training phase.</td>
                <td className="py-4 px-4 text-rose-500">Computationally expensive, performance degrades with high dimensionality.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Decision Tree (DT)</td>
                <td className="py-4 px-4">Decision trees split data into subsets based on feature values, yielding a tree structure.</td>
                <td className="py-4 px-4 text-green-500">Easy to interpret, handles both numerical and categorical data, fast to train.</td>
                <td className="py-4 px-4 text-rose-500">Prone to overfitting, unstable with small changes in data, biased towards features with more levels.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Random Forest (RF)</td>
                <td className="py-4 px-4">An ensemble method that builds multiple decision trees and aggregates their predictions.</td>
                <td className="py-4 px-4 text-green-500">Reduces overfitting, robust to noisy data, handles large datasets well, interpretable features.</td>
                <td className="py-4 px-4 text-rose-500">Can be slow to train, less interpretable compared to individual decision trees.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Extra Trees (ET)</td>
                <td className="py-4 px-4">Builds multiple decision trees with random feature splits and uses all features for each split.</td>
                <td className="py-4 px-4 text-green-500">Faster training than Random Forest, less prone to overfitting, highest accuracy on legal text.</td>
                <td className="py-4 px-4 text-rose-500">Less interpretable, requires more memory, sensitive to noisy data.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature extraction methods table */}
      <div className="glass-panel p-6 rounded-xl shadow-xl space-y-4 overflow-hidden border border-[var(--border-color)]">
        <h3 className="text-lg font-serif font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
          <Database className="w-5 h-5 text-[var(--gold-primary)]" />
          <span>Feature Extraction Methods Comparison</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--gold-primary)] font-mono uppercase">
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Pros</th>
                <th className="py-3 px-4 font-semibold">Cons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">TF-IDF</td>
                <td className="py-4 px-4 text-green-500">Assigns importance to rare words, reducing noise from common words.</td>
                <td className="py-4 px-4 text-rose-500">Does not capture word semantics or relationships. Sensitive to variations in vocabulary.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Count Vectorization</td>
                <td className="py-4 px-4 text-green-500">Simple and efficient for converting text to numerical form. Useful for frequency-based text analysis.</td>
                <td className="py-4 px-4 text-rose-500">Ignores the meaning and context of words. Results in high-dimensional sparse matrices.</td>
              </tr>
              <tr className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-4 px-4 font-serif font-bold text-[var(--text-primary)]">Word2Vec</td>
                <td className="py-4 px-4 text-green-500">Captures semantic relationships and word meanings in a dense vector format useful for neural networks.</td>
                <td className="py-4 px-4 text-rose-500">Requires a large corpus for effective training. Computationally expensive.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
