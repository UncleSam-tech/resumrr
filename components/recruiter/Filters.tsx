"use client";

import { useMemo } from 'react';
import { Candidate } from '@/lib/types';
import { downloadCSV, toCSV } from '@/lib/csv';

export type FiltersValue = {
  title: string;
  q: string;
};

export function Filters(props: {
  all: Candidate[];
  jobTitles: string[];
  value: FiltersValue;
  onChange: (next: FiltersValue) => void;
  onRefresh: () => void;
}) {
  const { all, jobTitles, value, onChange, onRefresh } = props;

  const count = all.length;

  const onReset = () => onChange({ title: '', q: '' });

  const onExport = () => {
    const csv = toCSV(all);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `resumrr-export-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
    downloadCSV(csv, filename);
  };

  const titles = useMemo(() => [''].concat(jobTitles), [jobTitles]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <div>
          <label className="label" htmlFor="title">Job Title</label>
          <select
            id="title"
            className="input"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          >
            {titles.map((t) => (
              <option key={t || 'all'} value={t}>{t ? t : 'All roles'}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="q">Keyword</label>
          <input
            id="q"
            className="input"
            placeholder="Search name, email, title, summary, skills"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
          Showing {count}
        </span>
        <button type="button" className="button" onClick={onRefresh}>Refresh</button>
        <button type="button" className="button" onClick={onExport}>Export CSV</button>
        <button type="button" className="button" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

