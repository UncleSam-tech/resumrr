"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Candidate, SortDir, SortKey } from '@/lib/types';
import { Filters, FiltersValue } from '@/components/recruiter/Filters';
import { Table } from '@/components/recruiter/Table';
import { EmptyState, ErrorState, LoadingState } from '@/components/recruiter/Empty';

type ApiResponse = { ok: boolean; updatedAt: string; data: Candidate[] };

export default function DashboardClient() {
  const [all, setAll] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersValue>({ title: '', q: '' });
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/recruiter/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setAll(json.data);
      setUpdatedAt(json.updatedAt);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = filters.q.trim().toLowerCase();
    const title = filters.title.trim().toLowerCase();
    return all.filter((r) => {
      const matchesTitle = !title || r.jobTitle.toLowerCase() === title;
      if (!matchesTitle) return false;
      if (!q) return true;
      const skills = (r.skills && r.skills.length ? r.skills : r.highlights).join(' ');
      const haystacks = [
        r.name,
        r.email,
        r.jobTitle,
        r.summary,
        skills,
      ].map((s) => s.toLowerCase());
      return haystacks.some((h) => h.includes(q));
    });
  }, [all, filters]);

  const jobTitles = useMemo(() => {
    const set = new Set<string>();
    (all || []).forEach((r) => set.add(r.jobTitle));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [all]);

  const lastUpdatedLabel = useMemo(() => {
    if (!updatedAt) return '';
    const d = new Date(updatedAt);
    return `${d.toLocaleTimeString()}`;
  }, [updatedAt]);

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
          <span className="text-xs text-gray-500">Last updated: {lastUpdatedLabel || '–'}</span>
        </div>
        <Filters
          all={filtered}
          jobTitles={jobTitles}
          value={filters}
          onChange={setFilters}
          onRefresh={load}
        />
      </div>

      {!all && !error && (
        <div className="card"><LoadingState /></div>
      )}
      {error && (
        <div className="card"><ErrorState onRetry={load} /></div>
      )}
      {all && filtered.length === 0 && !error && (
        <div className="card"><EmptyState message="No candidates match your filters." /></div>
      )}
      {all && filtered.length > 0 && (
        <div className="card">
          <Table rows={filtered} sort={sort} onSortChange={setSort} />
        </div>
      )}
    </div>
  );
}

