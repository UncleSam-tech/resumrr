import { NextRequest, NextResponse } from 'next/server';
import { Candidate } from '@/lib/types';

export const runtime = 'nodejs';

// Simple in-memory rate limiter: allow 30 requests per 5 minutes per IP
type Bucket = { tokens: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_TOKENS = 30;
const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return '';
}

function takeToken(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { tokens: RATE_LIMIT_TOKENS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const expected = req.nextUrl.origin;
  return (!origin || origin === expected) && (!referer || referer.startsWith(expected));
}

function toNumber(value: unknown, { min, max }: { min?: number; max?: number } = {}): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  const lower = typeof min === 'number' ? Math.max(n, min) : n;
  const clamped = typeof max === 'number' ? Math.min(lower, max) : lower;
  return clamped;
}

function normalize(input: any): Candidate[] {
  if (!Array.isArray(input)) return [];
  return input.map((r) => {
    const highlightsValue = r?.highlights;
    let highlights: string[] = [];
    if (Array.isArray(highlightsValue)) {
      highlights = highlightsValue.map(String);
    } else if (typeof highlightsValue === 'string') {
      highlights = highlightsValue
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const skillsValue = r?.skills ?? highlightsValue;
    let skills: string[] = [];
    if (Array.isArray(skillsValue)) {
      skills = skillsValue.map(String);
    } else if (typeof skillsValue === 'string') {
      skills = skillsValue
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const yearsExperience = toNumber(r?.yearsExperience, { min: 0 });
    const credibilityScore = toNumber(r?.credibilityScore, { min: 0, max: 100 });
    const atsScore = toNumber(r?.atsScore, { min: 0, max: 100 });
    const created = r?.createdAt ? String(r.createdAt) : new Date().toISOString();
    return {
      id: String(r?.id ?? ''),
      name: String(r?.name ?? ''),
      email: String(r?.email ?? ''),
      jobTitle: String(r?.jobTitle ?? ''),
      driveUrl: String(r?.driveUrl ?? ''),
      summary: String(r?.summary ?? ''),
      highlights,
      skills,
      yearsExperience,
      credibilityScore,
      atsScore,
      createdAt: created,
    } satisfies Candidate;
  });
}

export async function GET(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(req) || 'unknown';
  if (!takeToken(ip)) {
    return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  }

  const url = process.env.N8N_READ_URL;
  if (!url) {
    return NextResponse.json({ message: 'Server not configured' }, { status: 500 });
  }
  const auth = process.env.N8N_READ_AUTH;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json({ message: 'Upstream error' }, { status: 502 });
  }

  if (!upstream.ok) {
    let details = '';
    try {
      details = (await upstream.text()).slice(0, 500);
    } catch {}
    const status = upstream.status || 502;
    const statusText = upstream.statusText || '';
    return NextResponse.json(
      { message: `Upstream error ${status} ${statusText}`.trim(), details },
      { status }
    );
  }

  let json: any;
  try {
    json = await upstream.json();
  } catch {
    return NextResponse.json({ message: 'Invalid upstream JSON' }, { status: 502 });
  }

  const data = normalize(json);
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), data });
}

