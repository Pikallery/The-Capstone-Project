import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', businessName: '', phone: '', gstNumber: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        phone: form.phone || undefined,
        gstNumber: form.gstNumber || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center animate-slide-up">
          <CheckCircle className="text-success-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Registration Submitted</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">Your account is pending admin approval. You'll be notified once approved.</p>
          <Link to="/login" className="btn-primary">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 dark:bg-primary-700 rounded-2xl mb-4 shadow-lg">
            <Map className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create Business Account</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Village API Platform</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Business Email *</label>
              <input type="email" className="input" value={form.email} onChange={setField('email')} required placeholder="you@yourcompany.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Business Name *</label>
              <input type="text" className="input" value={form.businessName} onChange={setField('businessName')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password *</label>
                <input type="password" className="input" value={form.password} onChange={setField('password')} required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm *</label>
                <input type="password" className="input" value={form.confirm} onChange={setField('confirm')} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                <input type="tel" className="input" value={form.phone} onChange={setField('phone')} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">GST Number</label>
                <input type="text" className="input" value={form.gstNumber} onChange={setField('gstNumber')} placeholder="Optional" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 animate-fade-in">{error}</div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Submitting…' : 'Register'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500 dark:text-slate-400">
            Already registered? <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
