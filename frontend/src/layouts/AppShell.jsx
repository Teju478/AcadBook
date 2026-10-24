import { LogOut, Menu, X } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BrandMark } from '../components/Ui.jsx';
import { roleMeta, roleNavigation } from '../data/navigation.js';
import { useAuth } from '../components/Auth.jsx';

export function PublicShell({ children }) {
  return <div className="public-shell"><header className="public-nav"><BrandMark /><nav>{[{ label: 'Directory', to: '/' }, { label: 'How it works', to: '/#how-it-works' }].map((link) => <Link key={link.label} to={link.to}>{link.label}</Link>)}</nav><div className="public-actions"><Link className="button button-quiet" to="/login/user">Sign in</Link><Link className="button button-primary" to="/register/user">Join the portal</Link></div></header>{children}</div>;
}

export function AppShell({ role, title, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const meta = roleMeta[role];
  const links = roleNavigation[role];
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || meta.initials;
  const signOut = async () => { await logout(); navigate('/'); };
  return <div className="app-shell"><aside className={open ? 'sidebar open' : 'sidebar'}><div className="sidebar-top"><BrandMark /><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button></div><div className="workspace-label"><span className="eyebrow">{meta.eyebrow}</span><strong>{meta.label}</strong></div><nav className="side-nav">{links.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><button className="side-exit" onClick={signOut}><LogOut size={17} /> Sign out</button><small>{user?.institutionSlug || 'AcadBook'}</small></div></aside><div className="workspace"><header className="workspace-header"><button className="icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div><span className="eyebrow">{meta.eyebrow}</span><strong>{title || meta.label}</strong></div><div className="account-chip"><span>{initials}</span><div><strong>{user?.name || meta.label}</strong><small>{user?.email || `${role}@acadbook`}</small></div></div></header><main className="workspace-main">{children}</main></div></div>;
}
