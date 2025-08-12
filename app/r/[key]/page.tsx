import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import DashboardClient from './ui';

export const metadata: Metadata = {
  title: 'Resumrr — Recruiter',
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { key: string } }) {
  const secret = process.env.RECRUITER_KEY;
  if (!secret || params.key !== secret) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Recruiter Dashboard</h1>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
          Resumrr by Israel
        </span>
      </div>
      <Suspense fallback={<div className="card"><div className="animate-pulse h-6 bg-gray-200 rounded w-1/3" /></div>}>
        <DashboardClient />
      </Suspense>
    </main>
  );
}

