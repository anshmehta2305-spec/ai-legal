import API_BASE from "../api";
import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { Scale, Lock, Loader2, KeyRound } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (!resetToken) {
      addToast('Invalid or missing reset token', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/reset-password`, {
        token: resetToken,
        new_password: password
      });
      addToast('Password has been reset successfully. Please login.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to reset password. The token may have expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass p-8 rounded-xl text-center max-w-md w-full">
          <KeyRound className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">No reset token was found in the URL. Please request a new password reset link.</p>
          <Link to="/forgot-password" className="text-[var(--gold-primary)] font-semibold hover:underline">Go to Forgot Password</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <Scale className="w-[800px] h-[800px] text-[var(--gold-primary)] opacity-[0.02] transform rotate-12 -translate-x-1/4" />
      </div>

      <div className="w-full max-w-md relative z-10 glass p-10 rounded-2xl border border-[var(--gold-primary)]/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--gold-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--gold-primary)]/30">
            <Lock className="w-8 h-8 text-[var(--gold-primary)]" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-2 text-gold-glow">New Password</h2>
          <p className="text-sm text-[var(--text-secondary)] font-sans">Enter your new secure password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2" htmlFor="password">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[var(--gold-primary)] hover:bg-[var(--gold-secondary)] text-[var(--bg-primary)] font-bold py-3.5 rounded-lg shadow-md cursor-pointer transition-all duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            <span>Reset Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}
