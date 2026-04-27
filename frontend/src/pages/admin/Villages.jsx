import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '../../lib/api';

export default function AdminVillages() {
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [subDistrictId, setSubDistrictId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(500);

  const { data: states } = useQuery({
    queryKey: ['all-states'],
    queryFn: () => api.get('/admin/states').then(r => r.data.data),
  });

  const { data: districts } = useQuery({
    queryKey: ['districts', stateId],
    queryFn: () => api.get(`/admin/states/${stateId}/districts`).then(r => r.data.data),
    enabled: !!stateId,
  });

  const { data: subDistricts } = useQuery({
    queryKey: ['subdistricts', districtId],
    queryFn: () => api.get(`/admin/districts/${districtId}/subdistricts`).then(r => r.data.data),
    enabled: !!districtId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-villages', stateId, districtId, subDistrictId, search, page, limit],
    queryFn: () => api.get('/admin/villages', {
      params: { stateId: stateId || undefined, districtId: districtId || undefined, subDistrictId: subDistrictId || undefined, search: search || undefined, page, limit }
    }).then(r => r.data),
    enabled: !!(stateId || search),
  });

  const villages = data?.data || [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Village Master List</h1>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input w-44" value={stateId} onChange={e => { setStateId(e.target.value); setDistrictId(''); setSubDistrictId(''); setPage(1); }}>
            <option value="">Select State *</option>
            {states?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select className="input w-44" value={districtId} onChange={e => { setDistrictId(e.target.value); setSubDistrictId(''); setPage(1); }} disabled={!stateId}>
            <option value="">All Districts</option>
            {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select className="input w-48" value={subDistrictId} onChange={e => { setSubDistrictId(e.target.value); setPage(1); }} disabled={!districtId}>
            <option value="">All Sub-Districts</option>
            {subDistricts?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 w-48" placeholder="Search village…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <select className="input w-28" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={500}>500 rows</option>
            <option value={5000}>5,000 rows</option>
            <option value={10000}>10,000 rows</option>
          </select>
        </div>

        {!stateId && !search && (
          <p className="text-xs text-warning-700 mt-2">Please select a state or enter a search term to browse villages.</p>
        )}
      </div>

      {/* Table */}
      {(stateId || search) && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{data?.total?.toLocaleString() || 0} villages found</span>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <span className="px-2 py-1.5 text-xs">Page {page}</span>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPage(p => p + 1)} disabled={page * limit >= (data?.total || 0)}>Next</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['State', 'District', 'Sub-District', 'Code', 'Village Name'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : villages.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{v.state}</td>
                    <td className="px-4 py-2 text-gray-600">{v.district}</td>
                    <td className="px-4 py-2 text-gray-600">{v.subDistrict}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{v.code}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{v.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
