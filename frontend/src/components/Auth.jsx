import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from './DataState.jsx';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

const SESSION_USER_KEY = 'acadbook.session.user';

function readCachedUser() {
  try {
    const value = sessionStorage.getItem(SESSION_USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user) {
  try {
    if (user) sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // Storage is an optional performance enhancement; auth remains server-backed.
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const user = readCachedUser();
    return { status: user ? 'ready' : 'loading', user };
  });
  useEffect(() => {
    let active = true;
    api.me().then((payload) => {
      if (!active) return;
      writeCachedUser(payload.data);
      setState({ status: 'ready', user: payload.data });
    }).catch(() => {
      if (!active) return;
      writeCachedUser(null);
      setState({ status: 'ready', user: null });
    });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    ...state,
    acceptSessionUser: (user) => { writeCachedUser(user); setState({ status: 'ready', user }); },
    login: async (credentials) => {
      const payload = await api.login(credentials);
      writeCachedUser(payload.data);
      setState({ status: 'ready', user: payload.data });
      return payload;
    },
    logout: async () => {
      try { await api.logout(); } finally { writeCachedUser(null); setState({ status: 'ready', user: null }); }
    },
    refresh: async () => {
      try { const payload = await api.me(); writeCachedUser(payload.data); setState({ status: 'ready', user: payload.data }); return payload.data; } catch { writeCachedUser(null); setState({ status: 'ready', user: null }); return null; }
    }
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function ProtectedRoute({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState label="Checking your session" />;
  if (!user) return <Navigate to={`/login/${role}`} replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
}
