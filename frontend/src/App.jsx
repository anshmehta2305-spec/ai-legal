import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import History from './pages/History';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Sections from './pages/Sections';
import ChatBot from './pages/ChatBot';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Scale, Home as HomeIcon, UserPlus, LogIn, LayoutDashboard, Info, LogOut, ShieldAlert, History as HistoryIcon, Shield, User, BookOpen, MessageSquare, Sun, Moon } from 'lucide-react';
import GlobalSearch from './components/GlobalSearch';

function Navigation({ token, user, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
    ${isActive(path) 
      ? 'bg-[var(--gold-primary)] text-[var(--bg-primary)] font-semibold shadow-md border border-[var(--gold-primary)]/20' 
      : 'text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--card-bg)] hover:border-l-4 hover:border-[var(--gold-primary)]'
    }
  `;

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--gold-primary)]/10 p-2 rounded-lg border border-[var(--gold-primary)]/30">
            <Scale className="w-6 h-6 text-[var(--gold-primary)] animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-[var(--gold-primary)] tracking-wide">LEXCLUSTERING</h1>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest uppercase">AI Case Predictor</span>
          </div>
        </div>
      </div>

      <button 
        onClick={toggleTheme} 
        className="fixed top-6 right-8 z-50 p-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--gold-primary)] transition-all shadow-lg hover:shadow-[var(--shadow-color)]"
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <Link to="/" className={linkClass('/')}>
          <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Home</span>
        </Link>
        
        {!token ? (
          <>
            <Link to="/register" className={linkClass('/register')}>
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Register</span>
            </Link>
            <Link to="/login" className={linkClass('/login')}>
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Login</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Dashboard</span>
            </Link>
            <Link to="/history" className={linkClass('/history')}>
              <HistoryIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>History</span>
            </Link>
            <Link to="/sections" className={linkClass('/sections')}>
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>IPC Sections</span>
            </Link>
            <Link to="/chatbot" className={linkClass('/chatbot')}>
              <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>AI Assistant</span>
            </Link>
            <Link to="/profile" className={linkClass('/profile')}>
              <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Profile</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')}>
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Admin Panel</span>
              </Link>
            )}
          </>
        )}
        
        <Link to="/about" className={linkClass('/about')}>
          <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>About & Metrics</span>
        </Link>
      </nav>

      {/* User Session Info / Footer */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--card-bg)]/60">
        {token ? (
          <div className="space-y-3">
            <div className="px-2 flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: user?.avatar_color || 'var(--gold-primary)' }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-[var(--text-secondary)] font-mono">LOGGED IN AS</p>
                <p className="text-sm font-semibold text-[var(--gold-secondary)] truncate" title={user?.email}>
                  {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="text-center p-2">
            <p className="text-xs text-[var(--text-secondary)] font-serif italic">
              "Fiat justitia ruat caelum"
            </p>
            <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest mt-1 opacity-70">
              Let justice be done though the heavens fall
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
function PrivateRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const handleLoginSuccess = (jwtToken, userObj) => {
    setToken(jwtToken);
    setUser(userObj);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <GlobalSearch token={token} />
          <div className="min-h-screen bg-[var(--bg-primary)] flex transition-colors duration-300">
            {/* Sidebar Navigation */}
            <Navigation token={token} user={user} handleLogout={handleLogout} />
            
            {/* Main Content Area */}
            <main className="flex-1 ml-64 min-h-screen p-8 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
              <Routes>
                <Route path="/" element={<Home token={token} />} />
                <Route 
                  path="/register" 
                  element={token ? <Navigate to="/dashboard" /> : <Register />} 
                />
                <Route 
                  path="/login" 
                  element={token ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />} 
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute token={token}>
                      <Dashboard token={token} user={user} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <PrivateRoute token={token}>
                      <History token={token} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/sections" 
                  element={
                    <PrivateRoute token={token}>
                      <Sections token={token} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/chatbot" 
                  element={
                    <PrivateRoute token={token}>
                      <ChatBot token={token} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute token={token}>
                      <Profile token={token} user={user} onUpdateUser={setUser} />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <PrivateRoute token={token}>
                      {user?.role === 'admin' ? <Admin token={token} /> : <Navigate to="/dashboard" />}
                    </PrivateRoute>
                  } 
                />
                <Route path="/about" element={<About token={token} />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}