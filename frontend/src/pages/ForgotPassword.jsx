import API_BASE from "../api";
import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { Scale, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/forgot-password`, { email });
      setSuccess(true);
      addToast('Password reset link sent if email exists.', 'success');
    } catch (err) {
      // Don't reveal if email exists or not for security, just show success message
      setSuccess(true);
      addToast('Password reset link sent if email exists.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <Scale className="w-[800px] h-[800px] text-[var(--gold-primary)] opacity-[0.02] transform -rotate-12 translate-x-1/4" />
      </div>

      <div className="w-full max-w-md relative z-10 glass p-10 rounded-2xl border border-[var(--gold-primary)]/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--gold-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--gold-primary)]/30">
            <Mail className="w-8 h-8 text-[var(--gold-primary)]" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2 text-gold-glow">Recover Account</h2>
          <p className="text-sm text-[var(--text-secondary)] font-sans">Enter your registered email address</p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="bg-green-900/20 border border-green-500/30 text-green-400 p-4 rounded-lg text-sm">
              If an account with {email} exists, a password reset link has been sent to it. Please check your inbox and spam folder.
            </div>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-[var(--gold-primary)] hover:text-[var(--gold-secondary)] font-semibold transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-gray-600"
                  placeholder="advocate@lawfirm.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--gold-primary)] hover:bg-[var(--gold-secondary)] text-[var(--bg-primary)] font-bold py-3.5 rounded-lg shadow-md cursor-pointer transition-all duration-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              <span>Send Reset Link</span>
            </button>

            <div className="text-center pt-4 border-t border-[var(--border-color)]">
              <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Return to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
