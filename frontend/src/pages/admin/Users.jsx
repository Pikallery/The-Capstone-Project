import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle, XCircle, Pause } from 'lucide-react';
import api from '../../lib/api';

const STATUS_BADGE = {
  ACTIVE: 'bg-success-50 text-success-700',
  PENDING_APPROVAL: 'bg-warning-50 text-warning-700',
  SUSPENDED: 'bg-danger-50 text-danger-700',
  REJECTED: 'bg-gray-100 text-gray-600',
};

const PLAN_BADGE = {
  FREE: 'bg-gray-100 text-gray-700',
  PREMIUM: 'bg-primary-50 text-primary-700',
  PRO: 'bg-purple-50 text-purple-700',
  UNLIMITED: 'bg-success-50 text-success-700',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planType, setPlanType] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, status, planType, page],
    queryFn: () => api.get('/admin/users', { params: { search, status, planType, page, limit: 20 } }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const planMutation = useMutation({
    mutationFn: ({ id, planType }) => api.patch(`/admin/users/${id}/plan`, { planType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 w-64"
            placeholder="Search email or business…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="PENDING_APPROVAL">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select className="input w-36" value={planType} onChange={e => { setPlanType(e.target.value); setPage(1); }}>
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PREMIUM">Premium</option>
          <option value="PRO">Pro</option>
          <option value="UNLIMITED">Unlimited</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Business', 'Email', 'Plan', 'Status', 'Keys', 'Requests', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.businessName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className={`badge cursor-pointer border-0 ${PLAN_BADGE[u.planType]}`}
                    value={u.planType}
                    onClick={e => e.stopPropagation()}
                    onChange={e => planMutation.mutate({ id: u.id, planType: e.target.value })}
                  >
                    {['FREE', 'PREMIUM', 'PRO', 'UNLIMITED'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[u.status]}`}>{u.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u._count.apiKeys}</td>
                <td className="px-4 py-3 text-gray-600">{u._count.logs.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {u.status !== 'ACTIVE' && (
                      <button onClick={() => statusMutation.mutate({ id: u.id, status: 'ACTIVE' })} className="p-1.5 rounded-lg hover:bg-success-50 text-success-700" title="Approve">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {u.status !== 'SUSPENDED' && (
                      <button onClick={() => statusMutation.mutate({ id: u.id, status: 'SUSPENDED' })} className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-700" title="Suspend">
                        <Pause size={16} />
                      </button>
                    )}
                    {u.status !== 'REJECTED' && (
                      <button onClick={() => statusMutation.mutate({ id: u.id, status: 'REJECTED' })} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-700" title="Reject">
                        <XCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/admin/users/${u.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
