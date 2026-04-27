import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

const PLAN_LIMITS = { FREE: 5000, PREMIUM: 50000, PRO: 300000, UNLIMITED: 1000000 };

export default function B2BDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['b2b-summary'],
    queryFn: () => api.get('/b2b/usage/summary').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: history } = useQuery({
    queryKey: ['b2b-history'],
    queryFn: () => api.get('/b2b/usage/history?days=7').then(r => r.data.data),
  });

  const pct = summary ? Math.round((summary.today.requests / summary.limits.daily) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usage Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Monitor your API consumption in real time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Requests" value={summary?.today.requests?.toLocaleString()} sub={`of ${summary?.limits.daily.toLocaleString()} limit`} icon={Zap} color={pct > 90 ? 'red' : 'blue'} />
        <StatCard title="Remaining Today" value={summary?.today.remaining?.toLocaleString()} icon={TrendingUp} color="green" />
        <StatCard title="This Month" value={summary?.thisMonth.requests?.toLocaleString()} icon={CheckCircle} color="yellow" />
        <StatCard title="Avg Response" value={summary?.avgResponseTime ? `${summary.avgResponseTime}ms` : '—'} icon={Clock} color={summary?.avgResponseTime > 100 ? 'red' : 'green'} />
      </div>

      {/* Quota bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-gray-700">Daily Quota — {summary?.planType || 'FREE'}</span>
          <span className="text-gray-500">{pct}% used</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${pct > 95 ? 'bg-danger-500' : pct > 80 ? 'bg-warning-500' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Resets at midnight UTC</p>
      </div>

      {/* Usage chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Request History — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Total" />
            <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Success" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Plan info */}
      {summary?.planType === 'FREE' && (
        <div className="card p-5 border-warning-200 bg-warning-50">
          <p className="text-sm font-semibold text-warning-800 mb-1">Upgrade Your Plan</p>
          <p className="text-xs text-warning-700">You're on the Free plan (5,000 requests/day). Contact us to upgrade and unlock more requests, states, and priority support.</p>
        </div>
      )}
    </div>
  );
}
