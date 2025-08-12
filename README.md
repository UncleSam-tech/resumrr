# Resumrr by Israel

Secure resume intake landing page built with Next.js 14 App Router, TailwindCSS, and a serverless API that forwards submissions to an n8n webhook using HMAC signing.

## Features

- Secure client-to-API submission; no secrets on the client
- Validates required fields, email, file type, and size (≤ 10MB)
- Honeypot anti-spam and optional Cloudflare Turnstile verification
- HMAC-SHA256 signed payload forwarded to n8n via multipart/form-data
- Clean, accessible UI with TailwindCSS

## Getting started

1. Clone and install

```bash
npm i
```

2. Configure environment

Copy `.env.local.example` to `.env.local` and fill values:

```bash
cp .env.local.example .env.local
```

Required:

- `N8N_WEBHOOK_URL` — your n8n Webhook URL
- `N8N_WEBHOOK_SECRET` — long random string for HMAC

Optional (to enable Turnstile):

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

3. Run locally

```bash
npm run dev
```

Visit http://localhost:3000.

## Testing the API with curl

Replace the file path and values accordingly:

```bash
curl -i \
  -X POST http://localhost:3000/api/submit \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "jobTitle=Software Engineer" \
  -F "resume=@/absolute/path/to/resume.pdf;type=application/pdf"
```

Expected: `{ "ok": true }` and a 200 status if valid.

Errors:

- 400: validation error (missing fields, invalid email, wrong file type)
- 413: file too large
- 400: honeypot tripped
- 400: Turnstile missing/failed when enabled
- 502: n8n or Turnstile upstream errors

## n8n: verifying HMAC signature

In your n8n workflow, use a Function node before further processing to verify headers and prevent replay attacks.

Inputs:

- Headers: `x-payload`, `x-signature`, `x-timestamp`

Function node (JavaScript):

```javascript
// Requires: N8N_WEBHOOK_SECRET stored as an environment variable or in a credential
const crypto = require('node:crypto');

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const headers = $json.headers || {};
const payload = headers['x-payload'] || headers['X-Payload'];
const signature = headers['x-signature'] || headers['X-Signature'];
const timestamp = headers['x-timestamp'] || headers['X-Timestamp'];

if (!payload || !signature || !timestamp) {
  throw new Error('Missing signature headers');
}

// Reject replays older than 5 minutes
const FIVE_MIN_MS = 5 * 60 * 1000;
if (Math.abs(Date.now() - Number(timestamp)) > FIVE_MIN_MS) {
  throw new Error('Stale request');
}

const secret = $env.N8N_WEBHOOK_SECRET; // make sure to define this in n8n env
const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

if (!timingSafeEqualStr(expected, signature)) {
  throw new Error('Invalid signature');
}

return { verified: true, payload: JSON.parse(payload) };
```

Note: In the Webhook node, enable "Response Headers" and map headers into the JSON if you need to access them later; or read them directly in nodes that support headers.

## Deployment (Vercel)

1. Import the repo in Vercel
2. Set environment variables in both Preview and Production environments:
   - `N8N_WEBHOOK_URL`
   - `N8N_WEBHOOK_SECRET`
   - Optionally: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
3. Deploy

The API runs on the Node.js runtime to access crypto for HMAC.

## Security notes

- Secrets are only used on the server; the client never sees `N8N_WEBHOOK_SECRET`
- Same-origin enforced on the API route
- Honeypot and optional Turnstile reduce spam
- HMAC signature and timestamp protect n8n from tampering and replay
- Accepted file types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## Recruiter Dashboard

The dashboard is a simple secret-URL protected view of candidates returned by an n8n read-only endpoint.

### Environment

Add these to `.env.local`:

```
RECRUITER_KEY=r9-17-85219-IS-2025
N8N_READ_URL=https://YOUR-N8N/read-only/resumrr-candidates
N8N_READ_AUTH=Bearer SOME_LONG_TOKEN   # optional
```

### Access

Open:

`https://<your-vercel-domain>/r/<RECRUITER_KEY>`

If the key mismatches, a 404 is returned. The page is marked `noindex` and `robots.ts` disallows `/r/`.

### How it works

- Client fetches data from `/api/recruiter/data`
- The serverless route calls `N8N_READ_URL` and attaches `Authorization: N8N_READ_AUTH` if set
- Returns `{ ok: true, updatedAt, data }` with normalized `Candidate[]`
- The page supports filtering by Job Title, keyword search across multiple fields, sorting, CSV export, copy email, and opens Drive URLs in new tabs.

### Security and limits

- Secrets are not exposed to the browser; the proxy holds the URL/token
- Same-origin checks on the API route
- In-memory rate limiting (~30 req / 5 min) with 429s on abuse
- Consider Vercel Password Protection, Cloudflare Access, or SSO for stronger access control

## License

MIT

