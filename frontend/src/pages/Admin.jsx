import API_BASE from "../api";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { Shield, Activity, Users, Database, AlertOctagon, Terminal } from 'lucide-react';

export default function Admin({ token }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [logsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setLogs(logsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        addToast("Failed to load admin data. Ensure you have admin privileges.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3 glass-panel p-6 rounded-xl border-[var(--gold-primary)]/20 shadow-lg">
        <div className="bg-rose-900/20 p-3 rounded-lg border border-rose-500/30">
          <Shield className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">System Administration</h2>
          <p className="text-sm text-[var(--text-secondary)]">Manage users, monitor audit logs, and oversee system health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] flex items-center gap-4">
          <Users className="w-8 h-8 text-blue-400" />
          <div>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] flex items-center gap-4">
          <Activity className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">Audit Events</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] flex items-center gap-4">
          <Database className="w-8 h-8 text-purple-400" />
          <div>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">System Status</p>
            <p className="text-lg font-bold text-green-400">Online</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] flex flex-col h-[500px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Users className="w-5 h-5 text-[var(--gold-primary)]" />
            User Directory
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {loading ? <p>Loading users...</p> : users.map(u => (
              <div key={u.id} className="p-3 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{u.email}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Name: {u.name} | Role: {u.role}</p>
                </div>
                <div className={`text-[10px] uppercase px-2 py-1 rounded ${u.role === 'admin' ? 'bg-rose-900/30 text-rose-400' : 'bg-blue-900/30 text-blue-400'}`}>
                  {u.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="glass-panel p-6 rounded-xl border border-[var(--border-color)] flex flex-col h-[500px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Terminal className="w-5 h-5 text-[var(--gold-primary)]" />
            Security Audit Logs
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400/80 space-y-2">
            {loading ? <p>Loading logs...</p> : logs.map(l => (
              <div key={l.id} className="border-b border-green-900/30 pb-2">
                <span className="text-gray-500">[{new Date(l.timestamp).toISOString()}]</span>{' '}
                <span className={l.action.includes('failed') ? 'text-rose-400' : 'text-blue-300'}>{l.action}</span>{' '}
                - {l.email || 'System'} (IP: {l.ip_address})
                {l.details && <div className="ml-4 text-gray-400">↳ {l.details}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
