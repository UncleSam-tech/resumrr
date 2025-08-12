import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  // not always available in edge/serverless, return empty
  return '';
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_{2,}/g, '_');
  return `${Date.now()}_${base}`;
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return re.test(email);
}

export async function POST(req: NextRequest) {
  // Strict same-origin check
  const origin = req.headers.get('origin');
  const expectedOrigin = req.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ message: 'Forbidden origin' }, { status: 403 });
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!n8nUrl || !n8nSecret) {
    return NextResponse.json({ message: 'Server not configured' }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: 'Invalid form submission' }, { status: 400 });
  }

  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const jobTitle = String(form.get('jobTitle') || '').trim();
  const company = String(form.get('company') || '').trim(); // honeypot
  const resume = form.get('resume');
  const turnstileToken = String(form.get('turnstileToken') || '').trim();

  // Honeypot
  if (company) {
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  if (!name || !email || !jobTitle || !resume) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
  }

  if (!(resume instanceof File)) {
    return NextResponse.json({ message: 'Invalid file' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(resume.type)) {
    return NextResponse.json({ message: 'Unsupported file type' }, { status: 400 });
  }

  if (resume.size > MAX_BYTES) {
    return NextResponse.json({ message: 'File too large (max 10MB)' }, { status: 413 });
  }

  // Optional Turnstile verification
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!turnstileToken) {
      return NextResponse.json({ message: 'Turnstile token missing' }, { status: 400 });
    }
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: getClientIp(req) || '',
        }),
      });
      const verifyJson = (await verifyRes.json()) as { success?: boolean; 'error-codes'?: string[] };
      if (!verifyJson.success) {
        return NextResponse.json({ message: 'Turnstile verification failed' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ message: 'Turnstile verification error' }, { status: 502 });
    }
  }

  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';
  const timestamp = Date.now().toString();

  const payloadObj = { name, email, jobTitle, timestamp, ip };
  const payload = JSON.stringify(payloadObj);
  const signature = createHmac('sha256', n8nSecret).update(payload).digest('hex');

  // Prepare multipart form for n8n
  const forward = new FormData();
  forward.append('name', name);
  forward.append('email', email);
  forward.append('jobTitle', jobTitle);
  forward.append('timestamp', timestamp);
  forward.append('ip', ip);
  forward.append('userAgent', userAgent);

  const arrayBuf = await resume.arrayBuffer();
  const filename = sanitizeFilename(resume.name || 'resume');
  const blob = new Blob([arrayBuf], { type: resume.type });
  forward.append('resume', blob, filename);

  let n8nResponse: Response;
  try {
    n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      body: forward,
      headers: {
        'X-Payload': payload,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      },
    });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to reach n8n' }, { status: 502 });
  }

  if (!n8nResponse.ok) {
    const text = await n8nResponse.text().catch(() => '');
    return NextResponse.json({ message: `n8n error: ${text || n8nResponse.statusText}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

