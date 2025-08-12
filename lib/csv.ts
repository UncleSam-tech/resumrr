import { Candidate } from './types';

function quote(field: string): string {
  const needsQuotes = /[",\n\r]/.test(field);
  let escaped = field.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCSV(rows: Candidate[]): string {
  const header = [
    'id',
    'name',
    'email',
    'jobTitle',
    'driveUrl',
    'summary',
    'highlights',
    'createdAt',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    const values = [
      r.id,
      r.name,
      r.email,
      r.jobTitle,
      r.driveUrl,
      r.summary,
      r.highlights.join('; '),
      r.createdAt,
    ].map((v) => quote(String(v ?? '')));
    lines.push(values.join(','));
  }
  return lines.join('\r\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

