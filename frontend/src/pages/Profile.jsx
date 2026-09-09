import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { User, Lock, Save, AlertTriangle, Monitor, Clock, Shield, XCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Profile({ token, user, onUpdateUser }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    gender: user?.gender || '',
    age: user?.age || ''
  });

  const [passData, setPassData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  React.useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchLoginHistory();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/profile', { headers: { Authorization: `Bearer ${token}` } });
      setFormData({
        name: res.data.name || '',
        mobile: res.data.mobile || '',
        gender: res.data.gender || '',
        age: res.data.age || ''
      });
      onUpdateUser({ ...user, ...res.data });
    } catch (err) { console.error(err); }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/sessions', { headers: { Authorization: `Bearer ${token}` } });
      setSessions(res.data.sessions);
    } catch (err) { console.error(err); }
  };

  const fetchLoginHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/login-history', { headers: { Authorization: `Bearer ${token}` } });
      setLoginHistory(res.data.history);
    } catch (err) { console.error(err); }
  };

  const handleSetup2FA = async () => {
    setTfaLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/2fa/setup', {}, { headers: { Authorization: `Bearer ${token}` } });
      setQrCode(res.data.qr_code);
    } catch (err) { addToast('Failed to setup 2FA', 'error'); }
    finally { setTfaLoading(false); }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTfaLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/2fa/verify', { totp_code: totpCode }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('2FA Enabled Successfully', 'success');
      onUpdateUser({ ...user, totp_enabled: true });
      setQrCode(null);
      setTotpCode('');
    } catch (err) { addToast('Invalid 2FA Code', 'error'); }
    finally { setTfaLoading(false); }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTfaLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/2fa/disable', { totp_code: totpCode }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('2FA Disabled', 'success');
      onUpdateUser({ ...user, totp_enabled: false });
      setTotpCode('');
    } catch (err) { addToast('Invalid 2FA Code', 'error'); }
    finally { setTfaLoading(false); }
  };

  const handleRevokeSession = async (id) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/sessions/revoke/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchSessions();
      addToast('Session revoked', 'success');
    } catch (err) { addToast('Failed to revoke session', 'error'); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10) || 0
      };
      await axios.post('http://127.0.0.1:8000/api/profile/update', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Profile updated successfully', 'success');
      onUpdateUser({ ...user, ...payload });
    } catch (err) {
      let errorMsg = 'Update failed';
      if (err.response?.data?.detail) {
        errorMsg = Array.isArray(err.response.data.detail)
          ? err.response.data.detail[0].msg
          : err.response.data.detail;
      }
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setPassLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/profile/password', passData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Password updated successfully', 'success');
      setPassData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      addToast(err.response?.data?.detail || 'Password update failed', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3 glass-panel p-6 rounded-xl border-[var(--gold-primary)]/20 shadow-lg">
        <div className="bg-[var(--gold-primary)]/20 p-3 rounded-lg border border-[var(--gold-primary)]/30">
          <User className="w-8 h-8 text-[var(--gold-primary)]" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">User Profile</h2>
          <p className="text-sm text-[var(--text-secondary)]">Manage your personal information and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-xl border border-[var(--border-color)] space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-4">
            <User className="w-5 h-5 text-[var(--gold-primary)]" />
            Personal Details
          </h3>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Mobile</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full flex justify-center items-center gap-2 py-2.5 mt-4 bg-[var(--gold-primary)] text-[var(--bg-primary)] font-bold rounded-lg hover:bg-[var(--gold-secondary)] transition-colors">
            <Save size={18} />
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <form onSubmit={handleUpdatePassword} className="glass-panel p-6 rounded-xl border border-[var(--border-color)] space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-4">
            <Lock className="w-5 h-5 text-[var(--gold-primary)]" />
            Security
          </h3>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                required
                value={passData.current_password}
                onChange={e => setPassData({ ...passData, current_password: e.target.value })}
                className="w-full p-2.5 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
              />
              <button type="button" onClick={() => setShowCurrentPass(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={passData.new_password}
                onChange={e => setPassData({ ...passData, new_password: e.target.value })}
                className="w-full p-2.5 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
              />
              <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                value={passData.confirm_password}
                onChange={e => setPassData({ ...passData, confirm_password: e.target.value })}
                className="w-full p-2.5 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm"
              />
              <button type="button" onClick={() => setShowConfirmPass(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button disabled={passLoading} type="submit" className="w-full flex justify-center items-center gap-2 py-2.5 mt-4 bg-[var(--bg-primary)] border border-rose-500/50 text-rose-400 font-bold rounded-lg hover:bg-rose-900/30 transition-colors">
            <AlertTriangle size={18} />
            {passLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
      {/* Security & 2FA */}
      <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-4">
          <Shield className="w-5 h-5 text-[var(--gold-primary)]" />
          Two-Factor Authentication (2FA)
        </h3>

        {user?.totp_enabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">2FA is Currently Enabled</span>
            </div>
            <form onSubmit={handleDisable2FA} className="space-y-3">
              <label className="block text-xs font-mono uppercase text-[var(--text-secondary)]">Enter Code to Disable</label>
              <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="000000" className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm" maxLength={6} required />
              <button disabled={tfaLoading} type="submit" className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors w-full border border-red-500/30">Disable 2FA</button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">Enhance your account security by enabling Two-Factor Authentication using an app like Google Authenticator.</p>
            {!qrCode ? (
              <button onClick={handleSetup2FA} disabled={tfaLoading} className="px-4 py-2 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30 hover:bg-[var(--gold-primary)]/30 rounded-lg text-sm transition-colors w-full">Setup 2FA</button>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border-4 border-white rounded-xl" />
                <form onSubmit={handleVerify2FA} className="w-full space-y-3">
                  <label className="block text-xs font-mono uppercase text-[var(--text-secondary)]">Verify Code from App</label>
                  <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="000000" className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-center tracking-widest font-mono" maxLength={6} required />
                  <button disabled={tfaLoading} type="submit" className="px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm transition-colors w-full">Verify & Enable 2FA</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] space-y-4 md:col-span-2">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-4">
          <Monitor className="w-5 h-5 text-[var(--gold-primary)]" />
          Active Sessions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-secondary)]/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Device / IP</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]" title={s.user_agent}>{s.user_agent}</p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{s.ip_address}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {s.is_active ? <span className="px-2 py-1 text-[10px] bg-green-500/20 text-green-500 rounded-full">Active</span> : <span className="px-2 py-1 text-[10px] bg-red-500/20 text-red-500 rounded-full">Revoked</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active && (
                      <button onClick={() => handleRevokeSession(s.id)} className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors" title="Revoke Session">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-[var(--text-secondary)]">No sessions found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Login History */}
      <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] space-y-4 md:col-span-2">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-2 mb-4">
          <Clock className="w-5 h-5 text-[var(--gold-primary)]" />
          Recent Login History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-secondary)]/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Device / IP</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map(h => (
                <tr key={h.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--text-primary)] truncate max-w-[250px]" title={h.user_agent}>{h.user_agent}</p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{h.ip_address}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{new Date(h.login_time).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] rounded-full ${h.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{h.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
              {loginHistory.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-[var(--text-secondary)]">No history found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
