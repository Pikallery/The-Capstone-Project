import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

function statusClass(code) {
  if (code < 300) return 'text-success-700 bg-success-50';
  if (code < 500) return 'text-warning-700 bg-warning-50';
  return 'text-danger-700 bg-danger-50';
}

export default function AdminLogs() {
  const [statusCode, setStatusCode] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', statusCode, endpoint, page],
    queryFn: () => api.get('/admin/logs', { params: { statusCode: statusCode || undefined, endpoint: endpoint || undefined, page, limit: 50 } }).then(r => r.data),
    refetchInterval: 10000,
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">API Logs</h1>

      <div className="flex gap-3">
        <select className="input w-36" value={statusCode} onChange={e => { setStatusCode(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="2xx">2xx Success</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
        </select>
        <input className="input w-52" placeholder="Filter by endpoint…" value={endpoint} onChange={e => { setEndpoint(e.target.value); setPage(1); }} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Time', 'User', 'API Key', 'Endpoint', 'Status', 'Response Time', 'IP'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{l.user?.businessName || '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{l.apiKey?.key || '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{l.endpoint}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${statusClass(l.statusCode)}`}>{l.statusCode}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${l.responseTime > 100 ? 'text-warning-700' : 'text-success-700'}`}>
                      {l.responseTime}ms
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{l.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Total: {data?.total?.toLocaleString() || 0}</span>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= (data?.total || 0)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
