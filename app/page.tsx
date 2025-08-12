"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

declare global {
  // eslint-disable-next-line no-var
  var onTurnstileSuccess: ((token: string) => void) | undefined;
}

export default function Page() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const hasTurnstile = Boolean(siteKey);
  const turnstileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasTurnstile) return;
    globalThis.onTurnstileSuccess = (token: string) => setTurnstileToken(token);
  }, [hasTurnstile]);

  const emailValid = useMemo(() => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    return re.test(email);
  }, [email]);

  function validateClient(): string | null {
    if (!name.trim()) return 'Full name is required.';
    if (!emailValid) return 'Please enter a valid email address.';
    if (!jobTitle.trim()) return 'Job title is required.';
    if (!file) return 'Please attach your resume file.';
    if (!ALLOWED_TYPES.has(file.type)) {
      return 'Unsupported file type. Please upload a PDF, DOC, or DOCX file.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Maximum size is 10MB.';
    }
    if (company.trim() !== '') {
      return 'Spam detected.';
    }
    if (hasTurnstile && !turnstileToken) {
      return 'Failed Turnstile verification. Please complete the captcha.';
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: 'idle' });
    const error = validateClient();
    if (error) {
      setState({ status: 'error', message: error });
      return;
    }
    if (!file) return;

    try {
      setState({ status: 'submitting' });
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('jobTitle', jobTitle.trim());
      formData.append('resume', file);
      formData.append('company', company); // honeypot
      if (turnstileToken) formData.append('turnstileToken', turnstileToken);

      const res = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Submission failed.');
      }
      setState({ status: 'success', message: 'Thanks! Your resume was submitted successfully.' });
      // reset form
      setName('');
      setEmail('');
      setJobTitle('');
      setCompany('');
      setFile(null);
      setTurnstileToken(null);
      // attempt to reset the Turnstile widget (if present)
      try {
        // @ts-expect-error - turnstile may be injected globally by the script
        if (hasTurnstile && globalThis.turnstile && turnstileRef.current) {
          // @ts-expect-error
          globalThis.turnstile.reset(turnstileRef.current);
        }
      } catch (_) {}
    } catch (err: any) {
      setState({ status: 'error', message: err?.message || 'An unexpected error occurred.' });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
          Resumrr by Israel
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Submit your resume securely
        </h1>
        <p className="mt-2 text-gray-600">PDF, DOC, or DOCX up to 10MB. We verify and forward to our hiring workflow.</p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="name" className="label">Full Name</label>
            <input id="name" name="name" className="input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            <p className="hint">As it appears on your application.</p>
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" className="input" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {!emailValid && email && <p className="error-text">Enter a valid email address.</p>}
          </div>

          <div>
            <label htmlFor="jobTitle" className="label">Job Title</label>
            <input id="jobTitle" name="jobTitle" className="input" placeholder="Software Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
          </div>

          {/* Honeypot field (hidden from users) */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor="company" className="label">Company</label>
            <input id="company" name="company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" tabIndex={-1} />
          </div>

          <div>
            <label htmlFor="resume" className="label">Resume</label>
            <input
              id="resume"
              name="resume"
              type="file"
              className="input"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
              required
            />
            <p className="hint">Accepted types: PDF, DOC, DOCX. Max 10MB.</p>
            {file && !ALLOWED_TYPES.has(file.type) && (
              <p className="error-text">Unsupported file type.</p>
            )}
            {file && file.size > MAX_FILE_SIZE_BYTES && (
              <p className="error-text">File exceeds 10MB limit.</p>
            )}
          </div>

          {hasTurnstile && (
            <div>
              <div
                ref={turnstileRef}
                className="cf-turnstile"
                data-sitekey={siteKey}
                data-callback="onTurnstileSuccess"
                data-theme="auto"
              />
              <p className="hint">Protected by Cloudflare Turnstile.</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="text-red-700 bg-red-50 ring-1 ring-red-600/10 rounded-md p-3">
              {state.message}
            </div>
          )}
          {state.status === 'success' && (
            <div className="success-badge">{state.message}</div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" className="button" disabled={state.status === 'submitting'}>
              {state.status === 'submitting' ? 'Submitting…' : 'Submit Resume'}
            </button>
            <span className="text-xs text-gray-500">We’ll never share your email.</span>
          </div>
        </form>
      </div>

      <footer className="mt-10 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Resumrr by Israel
      </footer>
    </main>
  );
}

