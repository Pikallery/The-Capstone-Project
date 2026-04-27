import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Key, BookOpen, LogOut, Map, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useThemeStore } from '../stores/theme.store';

const nav = [
  { to: '/portal',       label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/portal/keys',  label: 'API Keys',     icon: Key },
  { to: '/portal/docs',  label: 'Documentation', icon: BookOpen },
];

export default function B2BLayout() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100 dark:border-slate-800">
          <Map className="text-primary-600 dark:text-primary-400" size={22} />
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Village API</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">B2B Portal</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <div className="mb-3 px-1">
            <div className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">{user?.businessName}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</div>
            <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 mt-1">{user?.planType}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
