import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MapPin, Users, Activity, Clock } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

function fmtNum(n) { return n?.toLocaleString('en-IN') ?? '—'; }

export default function AdminDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/admin/analytics/overview').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: timeSeries } = useQuery({
    queryKey: ['admin-time-series'],
    queryFn: () => api.get('/admin/analytics/requests-over-time?days=30').then(r => r.data.data),
  });

  const { data: rtTrend } = useQuery({
    queryKey: ['admin-rt-trend'],
    queryFn: () => api.get('/admin/analytics/response-time-trend').then(r => r.data.data),
  });

  const { data: endpoints } = useQuery({
    queryKey: ['admin-endpoints'],
    queryFn: () => api.get('/admin/analytics/endpoint-breakdown').then(r => r.data.data),
  });

  const { data: topStates } = useQuery({
    queryKey: ['admin-top-states'],
    queryFn: () => api.get('/admin/analytics/top-states').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Villages" value={fmtNum(overview?.totalVillages)} icon={MapPin} color="blue" />
        <StatCard title="Active Users" value={fmtNum(overview?.activeUsers)} sub={`of ${fmtNum(overview?.totalUsers)} total`} icon={Users} color="green" />
        <StatCard title="Today's Requests" value={fmtNum(overview?.todayRequests)} trend={parseFloat(overview?.requestGrowth)} icon={Activity} color="yellow" />
        <StatCard title="Avg Response Time" value={overview?.avgResponseTime ? `${overview.avgResponseTime}ms` : '—'} icon={Clock} color={overview?.avgResponseTime > 100 ? 'red' : 'green'} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">API Requests — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeSeries || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#gradTotal)" name="Requests" />
              <Area type="monotone" dataKey="error" stroke="#ef4444" fill="none" name="Errors" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Users by Plan</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={overview?.planDistribution || []} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={80} label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(overview?.planDistribution || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Response Time Trend (last 24h)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rtTrend || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => h.slice(11)} />
              <YAxis tick={{ fontSize: 11 }} unit="ms" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="p50" stroke="#22c55e" name="p50" dot={false} />
              <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="p95" dot={false} />
              <Line type="monotone" dataKey="p99" stroke="#ef4444" name="p99" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top States by Village Count</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topStates || []} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="village_count" fill="#3b82f6" name="Villages" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Endpoint breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Endpoint Usage (last 24h)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={endpoints || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="endpoint" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" name="Requests" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
