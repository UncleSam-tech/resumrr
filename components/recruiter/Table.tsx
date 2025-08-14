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
      if (sort.key === 'yearsExperience') {
        const va = a.yearsExperience ?? 0;
        const vb = b.yearsExperience ?? 0;
        return sort.dir === 'asc' ? va - vb : vb - va;
      }
      if (sort.key === 'credibilityScore') {
        const va = a.credibilityScore ?? 0;
        const vb = b.credibilityScore ?? 0;
        return sort.dir === 'asc' ? va - vb : vb - va;
      }
      if (sort.key === 'atsScore') {
        const va = a.atsScore ?? 0;
        const vb = b.atsScore ?? 0;
        return sort.dir === 'asc' ? va - vb : vb - va;
      }
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
            <Th label="CV" />
            <Th label="Years" active={sort.key === 'yearsExperience'} dir={sort.dir} onClick={() => toggleSort('yearsExperience')} />
            <Th label="Credibility" active={sort.key === 'credibilityScore'} dir={sort.dir} onClick={() => toggleSort('credibilityScore')} />
            <Th label="ATS" active={sort.key === 'atsScore'} dir={sort.dir} onClick={() => toggleSort('atsScore')} />
            <Th label="Skills" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{r.name}</td>
              <td className="whitespace-nowrap px-3 py-3 text-sm">
                <a href={r.driveUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">Open</a>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{r.yearsExperience ?? 0}</td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{r.credibilityScore ?? 0}</td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{r.atsScore ?? 0}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {(r.skills && r.skills.length ? r.skills : r.highlights).map((s, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {s}
                    </span>
                  ))}
                </div>
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

