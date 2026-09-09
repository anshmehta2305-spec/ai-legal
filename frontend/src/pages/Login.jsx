import API_BASE from "../api";
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const validate = () => {
    const tempErrors = {};
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!requires2FA && !validate()) return;

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      if (requires2FA) {
        payload.totp_code = totpCode;
      }

      const response = await axios.post(`${API_BASE}/api/login`, payload);

      const { access_token, user } = response.data;

      onLoginSuccess(access_token, user);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        if (err.response.data.detail === '2FA_REQUIRED') {
          setRequires2FA(true);
          setErrorMsg(null);
        } else {
          setErrorMsg(err.response.data.detail);
        }
      } else {
        setErrorMsg('Invalid email or password. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="glass p-8 rounded-2xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-legal-gold/10 p-3 rounded-full border border-legal-gold/30 mb-2">
            <LogIn className="w-8 h-8 text-legal-gold" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] tracking-wide font-serif">Welcome Back</h2>
          <p className="text-xs text-gray-500 font-sans mt-1">Sign in to access prediction and metrics panel</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] p-4 rounded-xl text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {requires2FA ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="totp">Authenticator Code (2FA)</label>
              <div className="relative">
                <input
                  type="text"
                  id="totp"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)]/50 focus:border-[var(--gold-primary)] transition-all font-mono tracking-widest text-center"
                  placeholder="000000"
                  maxLength={6}
                />
                <Lock className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] hover:opacity-90 text-[var(--bg-primary)] font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setRequires2FA(false)} className="text-[var(--gold-primary)] text-sm hover:underline">
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-legal-darker border ${errors.email ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-colors`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-legal-darker border ${errors.password ? 'border-rose-500' : 'border-legal-border'} focus:border-legal-gold text-[var(--text-primary)] pl-10 pr-12 py-3 rounded-lg text-sm outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-legal-gold cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-[var(--gold-primary)] hover:text-[var(--gold-secondary)] hover:underline transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-legal-gold to-legal-goldDark hover:from-legal-goldLight hover:to-legal-gold text-legal-darker font-bold py-3 rounded-lg shadow-md cursor-pointer hover:shadow-legal-gold/20 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-legal-gold hover:text-legal-goldLight font-semibold hover:underline">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
