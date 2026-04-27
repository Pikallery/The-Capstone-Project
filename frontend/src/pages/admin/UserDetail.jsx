import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, Trash2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [allStates, setAllStates] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/admin/users/${id}`).then(r => { setNotes(r.data.data.notes || ''); return r.data.data; }),
  });

  const { data: statesData } = useQuery({
    queryKey: ['all-states'],
    queryFn: () => api.get('/admin/states').then(r => r.data.data),
  });

  const [selectedStates, setSelectedStates] = useState([]);

  const accessMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/state-access`, {
      grantAll: allStates,
      stateIds: allStates ? [] : selectedStates,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', id] }),
  });

  const notesMutation = useMutation({
    mutationFn: () => api.patch(`/admin/users/${id}/notes`, { notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', id] }),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!user) return null;

  const grantedIds = user.stateAccess?.map(a => a.stateId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/users')} className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.businessName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="badge bg-primary-50 text-primary-700">{user.planType}</span>
          <span className="badge bg-gray-100 text-gray-700">{user.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Profile</h3>
          {[['Email', user.email], ['Phone', user.phone || '—'], ['GST', user.gstNumber || '—'], ['Registered', new Date(user.createdAt).toLocaleDateString()]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-900 font-medium">{v}</span>
            </div>
          ))}
        </div>

        {/* API Keys */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">API Keys ({user.apiKeys?.length || 0})</h3>
          <div className="space-y-2">
            {user.apiKeys?.map(k => (
              <div key={k.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium">{k.name}</span>
                  <span className="ml-2 text-gray-400 font-mono text-xs">{k.key.slice(0, 10)}…</span>
                </div>
                <span className={`badge ${k.isActive ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                  {k.isActive ? 'Active' : 'Revoked'}
                </span>
              </div>
            ))}
            {!user.apiKeys?.length && <p className="text-sm text-gray-400">No API keys yet</p>}
          </div>
        </div>

        {/* State Access */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} /> State Access</h3>
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allStates} onChange={e => setAllStates(e.target.checked)} />
              <span>Grant all India access</span>
            </label>
          </div>
          {!allStates && (
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto text-sm mb-3">
              {statesData?.map(s => (
                <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(s.id) || grantedIds.includes(s.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedStates(prev => [...prev, s.id]);
                      else setSelectedStates(prev => prev.filter(x => x !== s.id));
                    }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
          <button className="btn-primary text-xs" onClick={() => accessMutation.mutate()}>
            Save Access
          </button>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
          <textarea
            className="input resize-none h-28 mb-3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes about this user…"
          />
          <button className="btn-secondary text-xs" onClick={() => notesMutation.mutate()}>Save Notes</button>
        </div>
      </div>
    </div>
  );
}
