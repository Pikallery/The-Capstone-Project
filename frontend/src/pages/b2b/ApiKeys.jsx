import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

export default function B2BApiKeys() {
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['b2b-keys'],
    queryFn: () => api.get('/b2b/keys').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/b2b/keys', { name: newKeyName }),
    onSuccess: ({ data }) => {
      setCreatedKey(data.data);
      setNewKeyName('');
      qc.invalidateQueries({ queryKey: ['b2b-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: id => api.delete(`/b2b/keys/${id}`),
    onSuccess: () => { setConfirmRevoke(null); qc.invalidateQueries({ queryKey: ['b2b-keys'] }); },
  });

  const secretMutation = useMutation({
    mutationFn: id => api.post(`/b2b/keys/${id}/regenerate-secret`),
    onSuccess: ({ data }) => setCreatedKey({ ...data.data, regenerated: true }),
  });

  function copy(text) { navigator.clipboard.writeText(text); }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>

      {/* New secret reveal */}
      {createdKey && (
        <div className="card p-5 border-warning-200 bg-warning-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning-600 mt-0.5 shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-warning-800">{createdKey.regenerated ? 'New Secret Generated' : 'API Key Created'} — Save Now</p>
              <p className="text-xs text-warning-700 mb-3">The secret will never be shown again. Copy and store it securely.</p>
              {createdKey.key && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">API Key</p>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-warning-200">
                    <code className="text-xs font-mono flex-1 break-all">{createdKey.key}</code>
                    <button onClick={() => copy(createdKey.key)} className="text-gray-400 hover:text-gray-700"><Copy size={14} /></button>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">API Secret</p>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-warning-200">
                  <code className="text-xs font-mono flex-1 break-all">{createdKey.secret}</code>
                  <button onClick={() => copy(createdKey.secret)} className="text-gray-400 hover:text-gray-700"><Copy size={14} /></button>
                </div>
              </div>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-gray-400 hover:text-gray-700 text-sm">✕</button>
          </div>
        </div>
      )}

      {/* Create new key */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Create New API Key</h3>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Key name, e.g. Production Server"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => createMutation.mutate()}
            disabled={!newKeyName.trim() || createMutation.isPending}
          >
            <Plus size={16} /> {createMutation.isPending ? 'Creating…' : 'Create Key'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Maximum 5 active keys per account.</p>
      </div>

      {/* Keys table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'API Key', 'Created', 'Last Used', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : (data || []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No API keys yet. Create your first key above.</td></tr>
            ) : (data || []).map(k => (
              <tr key={k.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-500">{k.key}</code>
                    <button onClick={() => copy(k.key)} className="text-gray-300 hover:text-gray-600"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${k.isActive ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                    {k.isActive ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {k.isActive && (
                    <div className="flex gap-1">
                      <button onClick={() => secretMutation.mutate(k.id)} className="btn-secondary p-1.5 text-xs" title="Regenerate secret">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => setConfirmRevoke(k)} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="Revoke">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revoke confirmation modal */}
      {confirmRevoke && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Revoke API Key?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will immediately disable <strong>{confirmRevoke.name}</strong>. Any integrations using it will stop working.
            </p>
            <div className="flex gap-3">
              <button className="btn-danger flex-1 justify-center" onClick={() => revokeMutation.mutate(confirmRevoke.id)}>
                Revoke Key
              </button>
              <button className="btn-secondary flex-1 justify-center" onClick={() => setConfirmRevoke(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
