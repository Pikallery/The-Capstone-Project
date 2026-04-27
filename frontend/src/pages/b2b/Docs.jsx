import React, { useState } from 'react';
import { Copy } from 'lucide-react';

const BASE_URL = 'https://api.villageapi.com/v1';

const ENDPOINTS = [
  {
    method: 'GET', path: '/search', desc: 'Search villages by name',
    params: [{ name: 'q', type: 'string', required: true, desc: 'Search query (min 2 chars)' }, { name: 'state', type: 'string', desc: 'Filter by state name' }, { name: 'limit', type: 'number', desc: 'Results per page (max 100, default 25)' }, { name: 'page', type: 'number', desc: 'Page number' }],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/search?q=Manibeli"`,
  },
  {
    method: 'GET', path: '/autocomplete', desc: 'Typeahead suggestions for forms',
    params: [{ name: 'q', type: 'string', required: true, desc: 'Search prefix (min 2 chars)' }, { name: 'hierarchyLevel', type: 'string', desc: 'village | state | district (default: village)' }, { name: 'limit', type: 'number', desc: 'Results (max 20, default 10)' }],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/autocomplete?q=Mani&hierarchyLevel=village"`,
  },
  {
    method: 'GET', path: '/states', desc: 'List all states',
    params: [],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/states"`,
  },
  {
    method: 'GET', path: '/states/{id}/districts', desc: 'Get districts for a state',
    params: [{ name: 'id', type: 'integer', required: true, desc: 'State ID from /states endpoint' }],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/states/27/districts"`,
  },
  {
    method: 'GET', path: '/districts/{id}/subdistricts', desc: 'Get sub-districts for a district',
    params: [{ name: 'id', type: 'integer', required: true, desc: 'District ID' }],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/districts/497/subdistricts"`,
  },
  {
    method: 'GET', path: '/subdistricts/{id}/villages', desc: 'Get villages in a sub-district',
    params: [{ name: 'id', type: 'integer', required: true, desc: 'Sub-district ID' }, { name: 'page', type: 'number', desc: 'Page number' }, { name: 'limit', type: 'number', desc: 'Page size (max 500)' }],
    example: `curl -H "X-API-Key: ak_your_key" "${BASE_URL}/subdistricts/1234/villages"`,
  },
];

const CODE_EXAMPLES = {
  curl: (ep) => ep.example,
  python: (ep) => `import requests

headers = {"X-API-Key": "ak_your_key"}
resp = requests.get("${BASE_URL}${ep.path.replace(/\{.*?\}/g, '1')}", headers=headers${ep.params.find(p => p.required && p.name === 'q') ? `, params={"q": "Manibeli"}` : ''})
data = resp.json()
print(data)`,
  javascript: (ep) => `const response = await fetch(
  "${BASE_URL}${ep.path.replace(/\{.*?\}/g, '1')}${ep.params.find(p => p.required && p.name === 'q') ? '?q=Manibeli' : ''}",
  { headers: { "X-API-Key": "ak_your_key" } }
);
const data = await response.json();
console.log(data);`,
  php: (ep) => `<?php
$ch = curl_init("${BASE_URL}${ep.path.replace(/\{.*?\}/g, '1')}${ep.params.find(p => p.required && p.name === 'q') ? '?q=Manibeli' : ''}");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: ak_your_key"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$data = json_decode(curl_exec($ch), true);
print_r($data);`,
};

function copy(text) { navigator.clipboard.writeText(text); }

export default function B2BDocs() {
  const [lang, setLang] = useState('curl');
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>

      {/* Auth */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Authentication</h2>
        <p className="text-sm text-gray-600 mb-3">All requests require an API key in the <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key</code> header.</p>
        <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400">
          curl -H "X-API-Key: ak_your_key" "{BASE_URL}/states"
        </div>
      </div>

      {/* Response format */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Standard Response</h2>
        <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
          <pre>{JSON.stringify({
            success: true, count: 1,
            data: [{ value: "village_id_525002", label: "Manibeli", fullAddress: "Manibeli, Akkalkuwa, Nandurbar, Maharashtra, India", hierarchy: { village: "Manibeli", subDistrict: "Akkalkuwa", district: "Nandurbar", state: "Maharashtra", country: "India" } }],
            meta: { responseTime: 42, rateLimit: { remaining: 4999, limit: 5000, reset: "2024-01-15T00:00:00Z" } }
          }, null, 2)}</pre>
        </div>
      </div>

      {/* Endpoints */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          <div className="w-72 border-r border-gray-100 shrink-0">
            {ENDPOINTS.map((ep, i) => (
              <button
                key={ep.path}
                onClick={() => setActive(i)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 flex items-center gap-2 ${active === i ? 'bg-primary-50 border-l-2 border-primary-500' : 'hover:bg-gray-50'}`}
              >
                <span className="badge bg-success-100 text-success-700 font-mono text-xs">{ep.method}</span>
                <span className="text-gray-800 font-mono text-xs truncate">{ep.path}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {(() => {
              const ep = ENDPOINTS[active];
              return (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-success-100 text-success-700 font-mono">{ep.method}</span>
                      <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                    </div>
                    <p className="text-sm text-gray-600">{ep.desc}</p>
                  </div>

                  {ep.params.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parameters</h4>
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-100">{['Name', 'Type', 'Required', 'Description'].map(h => <th key={h} className="text-left py-1 pr-3 text-gray-500">{h}</th>)}</tr></thead>
                        <tbody>
                          {ep.params.map(p => (
                            <tr key={p.name} className="border-b border-gray-50">
                              <td className="py-1.5 pr-3 font-mono text-primary-700">{p.name}</td>
                              <td className="py-1.5 pr-3 text-gray-500">{p.type}</td>
                              <td className="py-1.5 pr-3">{p.required ? <span className="badge bg-danger-50 text-danger-700">required</span> : <span className="text-gray-300">optional</span>}</td>
                              <td className="py-1.5 text-gray-600">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Example</h4>
                      <div className="flex gap-1">
                        {Object.keys(CODE_EXAMPLES).map(l => (
                          <button key={l} onClick={() => setLang(l)} className={`px-2 py-1 rounded text-xs font-medium ${lang === l ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => copy(CODE_EXAMPLES[lang](ep))} className="absolute top-2 right-2 text-gray-400 hover:text-gray-200">
                        <Copy size={14} />
                      </button>
                      <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
                        <pre>{CODE_EXAMPLES[lang](ep)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Error codes */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Error Codes</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">{['HTTP', 'Code', 'Description'].map(h => <th key={h} className="text-left py-2 pr-4 text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody>
            {[
              [400, 'INVALID_QUERY', 'Search query too short or invalid'],
              [401, 'INVALID_API_KEY', 'API key missing or invalid'],
              [403, 'ACCESS_DENIED', 'User not authorized for requested state'],
              [404, 'NOT_FOUND', 'Requested resource does not exist'],
              [429, 'RATE_LIMITED', 'Daily quota exceeded'],
              [500, 'INTERNAL_ERROR', 'Server-side error'],
            ].map(([code, name, desc]) => (
              <tr key={code} className="border-b border-gray-50">
                <td className="py-2 pr-4"><span className={`badge ${code >= 500 ? 'bg-danger-50 text-danger-700' : code >= 400 ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700'}`}>{code}</span></td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-700">{name}</td>
                <td className="py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
