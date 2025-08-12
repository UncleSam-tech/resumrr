"use client";

import { useMemo, useState } from 'react';
import { Candidate, SortDir, SortKey } from '@/lib/types';

export function Table(props: {
  rows: Candidate[];
  sort: { key: SortKey; dir: SortDir };
  onSortChange: (sort: { key: SortKey; dir: SortDir }) => void;
}) {
  const { rows, sort, onSortChange } = props;
  const [copied, setCopied] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let va: string = '';
      let vb: string = '';
      if (sort.key === 'createdAt') {
        va = a.createdAt;
        vb = b.createdAt;
      } else if (sort.key === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else if (sort.key === 'jobTitle') {
        va = a.jobTitle.toLowerCase();
        vb = b.jobTitle.toLowerCase();
      }
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    if (sort.key !== key) {
      onSortChange({ key, dir: key === 'createdAt' ? 'desc' : 'asc' });
    } else {
      onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th label="Name" active={sort.key === 'name'} dir={sort.dir} onClick={() => toggleSort('name')} />
            <Th label="Email" />
            <Th label="Job Title" active={sort.key === 'jobTitle'} dir={sort.dir} onClick={() => toggleSort('jobTitle')} />
            <Th label="Summary" />
            <Th label="Highlights" />
            <Th label="Resume" />
            <Th label="Created" active={sort.key === 'createdAt'} dir={sort.dir} onClick={() => toggleSort('createdAt')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{r.name}</td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-blue-700">
                <button type="button" className="underline" onClick={() => copyEmail(r.email)} title="Copy email">
                  {r.email}
                </button>
                {copied === r.email && (
                  <span className="ml-2 text-xs text-green-600">Copied</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
                  {r.jobTitle}
                </span>
              </td>
              <td className="px-3 py-3 text-sm text-gray-700">
                <span title={r.summary}>
                  {r.summary.length > 160 ? r.summary.slice(0, 157) + '…' : r.summary}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.highlights.map((h, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {h}
                    </span>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm">
                <a href={r.driveUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">Open</a>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                {new Date(r.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ label, active, dir, onClick }: { label: string; active?: boolean; dir?: SortDir; onClick?: () => void }) {
  return (
    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 select-none">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1">
        {label}
        {active && (
          <span className="text-gray-400">{dir === 'asc' ? '▲' : '▼'}</span>
        )}
      </button>
    </th>
  );
}

