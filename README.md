# Resumrr by Israel

Secure resume intake landing page built with Next.js 14 App Router, TailwindCSS, and a serverless API that forwards submissions to an n8n webhook using HMAC signing.

## Features

- Secure client-to-API submission; no secrets on the client
- Validates required fields, email, file type, and size (≤ 10MB)
- Honeypot anti-spam and optional Cloudflare Turnstile verification
- HMAC-SHA256 signed payload forwarded to n8n via multipart/form-data
- Clean, accessible UI with TailwindCSS


