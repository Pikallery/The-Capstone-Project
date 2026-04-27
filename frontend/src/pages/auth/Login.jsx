import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Map, Sun, Moon } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';

/* ── Circuit dot/connector SVG pattern ───────────────────────── */
function CircuitPattern({ className }) {
  return (
    <svg viewBox="0 0 340 300" className={className} fill="none" aria-hidden="true">
      <path d="M 0 55 H 48 Q 68 55 68 35 V 0"                                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 0 115 H 68 Q 88 115 88 95 V 55 Q 88 35 108 35 H 175"                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 118 0 V 35"                                                                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 175 0 V 55 Q 175 75 195 75 H 260 Q 280 75 280 95 V 130"                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 0 175 H 48 Q 68 175 68 155 V 115"                                           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 230 0 V 40 Q 230 60 250 60 H 340"                                           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 280 130 V 175 Q 280 195 260 195 H 195 Q 175 195 175 215 V 260"             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 0 235 H 88 Q 108 235 108 215 V 175 Q 108 155 128 155 H 195"               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 175 260 V 300"                                                               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 195 75 V 130 Q 195 150 215 150 H 280"                                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 108 215 Q 140 215 140 185"                                                  stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" strokeLinecap="round"/>
      <path d="M 195 130 Q 240 130 240 95"                                                   stroke="currentColor" strokeWidth="1" strokeDasharray="4 5" strokeLinecap="round"/>
      <circle cx="0"   cy="55"  r="4.5" fill="currentColor"/>
      <circle cx="0"   cy="115" r="4.5" fill="currentColor"/>
      <circle cx="0"   cy="175" r="4.5" fill="currentColor"/>
      <circle cx="0"   cy="235" r="4.5" fill="currentColor"/>
      <circle cx="68"  cy="0"   r="4.5" fill="currentColor"/>
      <circle cx="118" cy="0"   r="4.5" fill="currentColor"/>
      <circle cx="175" cy="0"   r="4.5" fill="currentColor"/>
      <circle cx="230" cy="0"   r="4.5" fill="currentColor"/>
      <circle cx="175" cy="300" r="4.5" fill="currentColor"/>
      <circle cx="280" cy="130" r="4.5" fill="currentColor"/>
      <circle cx="175" cy="260" r="4.5" fill="currentColor"/>
      <circle cx="68"  cy="55"  r="3"   fill="currentColor"/>
      <circle cx="88"  cy="95"  r="3"   fill="currentColor"/>
      <circle cx="175" cy="55"  r="3"   fill="currentColor"/>
      <circle cx="260" cy="75"  r="3"   fill="currentColor"/>
      <circle cx="68"  cy="155" r="3"   fill="currentColor"/>
      <circle cx="108" cy="35"  r="3"   fill="currentColor"/>
      <circle cx="195" cy="75"  r="3"   fill="currentColor"/>
      <circle cx="195" cy="150" r="3"   fill="currentColor"/>
      <circle cx="108" cy="215" r="3"   fill="currentColor"/>
      <circle cx="195" cy="215" r="3"   fill="currentColor"/>
      <circle cx="128" cy="155" r="3"   fill="currentColor"/>
      <circle cx="250" cy="60"  r="3"   fill="currentColor"/>
      <circle cx="280" cy="175" r="3"   fill="currentColor"/>
    </svg>
  );
}

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuthStore();
  const { dark, toggle }      = useThemeStore();
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data.token, data.data.user);
      navigate(data.data.user.isAdmin ? '/admin' : '/portal');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    /*
      Light mode: white/very-light-gray background (matches the reference circuit board image)
      Dark mode:  dark slate background
    */
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4
                    bg-gray-50 dark:bg-slate-950">

      {/* Circuit — top-left: gray in light, slate in dark */}
      <CircuitPattern className="absolute top-0 left-0 w-[340px] h-[300px]
                                  text-gray-300 dark:text-slate-700
                                  pointer-events-none select-none" />

      {/* Circuit — bottom-right (rotated) */}
      <CircuitPattern className="absolute bottom-0 right-0 w-[340px] h-[300px] rotate-180
                                  text-gray-300 dark:text-slate-700
                                  pointer-events-none select-none" />

      {/* Dark mode toggle */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full
                   bg-white dark:bg-slate-800
                   text-gray-600 dark:text-slate-300
                   border border-gray-200 dark:border-slate-700
                   shadow-sm hover:shadow-md
                   transition-all duration-150"
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card — slides up on load */}
      <div className="w-full max-w-md animate-slide-up">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
                          bg-primary-600 dark:bg-primary-700 shadow-lg">
            <Map className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            Village API Platform
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-slate-800
                        border border-gray-200 dark:border-slate-700
                        rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm animate-fade-in
                              bg-red-50 dark:bg-red-900/20
                              border border-red-200 dark:border-red-800
                              text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-slate-400">
            New business?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
