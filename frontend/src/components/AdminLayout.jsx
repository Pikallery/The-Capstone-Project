import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, MapPin, ScrollText, LogOut,
  Menu, X, Map, Bell, Sun, Moon, CheckCircle, Clock,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';
import api from '../lib/api';

const nav = [
  { to: '/admin',          label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { to: '/admin/users',    label: 'Users',          icon: Users },
  { to: '/admin/villages', label: 'Village Browser', icon: MapPin },
  { to: '/admin/logs',     label: 'API Logs',       icon: ScrollText },
];

/* ── Relative timestamp ────────────────────────────────────────── */
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ── Notification bell ─────────────────────────────────────────── */
function NotificationBell({ navigate }) {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif-seen') || '[]')); }
    catch { return new Set(); }
  });
  const panelRef = useRef(null);

  const { data: notifs = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/admin/notifications').then(r => r.data.data),
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
  });

  const unseen = notifs.filter(n => !seenIds.has(n.id)).length;

  function markAllSeen() {
    const all = new Set(notifs.map(n => n.id));
    setSeenIds(all);
    localStorage.setItem('notif-seen', JSON.stringify([...all]));
  }

  function handleOpen() {
    setOpen(o => !o);
    if (!open) markAllSeen();
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center
                           bg-danger-500 text-white text-[10px] font-bold rounded-full animate-ping-once">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
            {notifs.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-slate-500">No recent notifications</p>
            ) : notifs.map(n => (
              <button
                key={n.id}
                onClick={() => { navigate(`/admin/users/${n.userId}`); setOpen(false); }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left
                           hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                               ${n.type === 'pending'
                                 ? 'bg-warning-50 dark:bg-yellow-900/30 text-warning-700 dark:text-yellow-400'
                                 : 'bg-success-50 dark:bg-green-900/30 text-success-700 dark:text-green-400'}`}>
                  {n.type === 'pending' ? <Clock size={13} /> : <CheckCircle size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{n.title}</p>
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate">{n.message}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{n.sub}</p>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 mt-0.5">
                  {timeAgo(n.timestamp)}
                </span>
              </button>
            ))}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => { navigate('/admin/users'); setOpen(false); }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                View all users →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Admin Layout ──────────────────────────────────────────────── */
export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${open ? 'w-64' : 'w-16'} shrink-0 flex flex-col
                         bg-white dark:bg-slate-900
                         border-r border-gray-200 dark:border-slate-800
                         transition-[width] duration-200 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          {open && (
            <div className="flex items-center gap-2 animate-fade-in">
              <Map className="text-primary-600 dark:text-primary-400" size={22} />
              <span className="text-gray-900 dark:text-white font-bold text-sm tracking-tight">Village API</span>
            </div>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {open && <span className="animate-fade-in truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-1">
          {open && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mb-1 truncate px-3 animate-fade-in">{user?.email}</div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3
                           bg-white dark:bg-slate-900
                           border-b border-gray-200 dark:border-slate-800
                           shrink-0">
          <div className="text-sm font-semibold text-gray-700 dark:text-slate-200 tracking-tight">
            Admin Panel
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell navigate={navigate} />
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
