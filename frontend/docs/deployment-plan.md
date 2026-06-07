# Resume Shapeshifter — Deployment Plan

> **Document Version:** 1.0  
> **Last Updated:** 2026-05-26  
> **Target Platform:** Vercel (Recommended)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Vercel Deployment (Recommended)](#3-vercel-deployment-recommended)
4. [Alternative: Docker Deployment](#4-alternative-docker-deployment)
5. [Alternative: Self-Hosted (VPS)](#5-alternative-self-hosted-vps)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Post-Deployment Checklist](#7-post-deployment-checklist)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)
9. [Troubleshooting](#9-troubleshooting)
10. [Rollback Strategy](#10-rollback-strategy)

---

## 1. Overview

### 1.1 Architecture

```
User Browser
     │
     ▼
Vercel Edge Network ──► Next.js App (Serverless)
     │                          │
     │                    ┌─────┴──────┐
     │                    │            │
     ▼                    ▼            ▼
Static Pages          API Routes    PDF Generation
(/ , /analysis,      (parse-resume,  (@react-pdf/
  /export)            parse-jd,       renderer)
                      score,
                      tailor,
                      gaps,
                      export-pdf)
                              │
                              ▼
                        Groq API
                     (llama-3.3-70b)
```

### 1.2 Tech Stack

| Component         | Technology                    | Notes                            |
|-------------------|-------------------------------|----------------------------------|
| Framework         | Next.js 16.2.6                | App Router, Turbopack            |
| UI                | React 19 + Tailwind CSS       | Shadcn UI components             |
| State Management  | Zustand 5                     | Client-side store                |
| LLM Client        | Groq SDK                      | llama-3.3-70b-versatile model    |
| PDF Generation    | @react-pdf/renderer 4.x       | Server-side PDF rendering        |
| Validation        | Zod 4                         | Schema validation throughout     |
| Deployment        | Vercel (serverless)           | Or Docker / self-hosted          |

---

## 2. Prerequisites

### 2.1 Required Accounts

- [ ] **Vercel account** — Sign up at https://vercel.com (free tier works)
- [ ] **Groq API key** — Get at https://console.groq.com/keys (free tier: 30 req/min)

### 2.2 Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd resume-shapeshifter

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Groq API key:
# GROQ_API_KEY=gsk_your_key_here

# 4. Run development server
npm run dev

# 5. Verify it works
# Open http://localhost:3000
# Click "Try with sample data" → Click "Analyze Match"
```

### 2.3 Pre-deployment Checklist

- [ ] `npm run build` succeeds without errors
- [ ] All API routes return 200 with sample data:
  - `POST /api/parse-resume`
  - `POST /api/parse-jd`
  - `POST /api/score`
  - `POST /api/tailor`
  - `POST /api/gaps`
  - `POST /api/export-pdf`
- [ ] All static pages render: `/`, `/analysis`, `/export`
- [ ] `.env.local` is NOT committed to git (ensure `.gitignore` has it)

---

## 3. Vercel Deployment (Recommended)

### 3.1 One-Click Deploy via CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Navigate to project
cd resume-shapeshifter

# Login to Vercel
vercel login

# Deploy (interactive — follow prompts)
vercel

# Deploy to production (skips prompts after first deploy)
vercel --prod
```

### 3.2 Deploy via Vercel Dashboard (Alternative)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects Next.js — keep default settings
5. Add environment variables (see Section 6)
6. Click "Deploy"

### 3.3 Required Vercel Configuration

#### `next.config.ts` (already configured)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
```

#### `vercel.json` (optional — auto-detected)

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 3.4 Environment Variables on Vercel

Set these in the Vercel Dashboard:
- **Project Settings → Environment Variables**

| Name             | Value                          | Environment |
|------------------|--------------------------------|-------------|
| `GROQ_API_KEY`   | `gsk_your_groq_api_key_here`   | Production  |
| `GROQ_API_KEY`   | `gsk_your_groq_api_key_here`   | Preview     |
| `GROQ_API_KEY`   | `gsk_your_groq_api_key_here`   | Development |

### 3.5 Important: LLM Timeout Consideration

Groq API calls can take **15–35 seconds** depending on load:
- **Vercel Hobby (free):** Serverless functions timeout after **10 seconds** → May cause 504 errors for `/api/tailor`
- **Vercel Pro ($20/mo):** Serverless functions timeout after **60 seconds** → Sufficient for all endpoints
- **Vercel Enterprise:** Custom timeouts available

**Mitigation if on Hobby plan:**
- Set up a **cron job** or **queue** for long-running operations
- Or switch to self-hosted deployment

---

## 4. Alternative: Docker Deployment

### 4.1 Dockerfile

Create `resume-shapeshifter/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 4.2 Docker Build & Run

```bash
# Build the Docker image
cd resume-shapeshifter
docker build -t resume-shapeshifter .

# Run the container
docker run -p 3000:3000 \
  -e GROQ_API_KEY=gsk_your_key_here \
  resume-shapeshifter
```

### 4.3 Docker Compose

Create `resume-shapeshifter/docker-compose.yml`:

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

---

## 5. Alternative: Self-Hosted (VPS)

### 5.1 Requirements

| Resource   | Minimum  | Recommended |
|------------|----------|-------------|
| CPU        | 1 core   | 2 cores     |
| RAM        | 1 GB     | 2 GB        |
| Storage    | 1 GB     | 5 GB        |
| Node.js    | 18.x     | 22.x        |
| Process Mgr| PM2      | PM2         |

### 5.2 Deployment Steps

```bash
# 1. SSH into your server
ssh user@your-server

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone the repo & install
git clone <repo-url> /var/www/resume-shapeshifter
cd /var/www/resume-shapeshifter
npm install

# 4. Set up environment
echo "GROQ_API_KEY=gsk_your_key_here" > .env.local

# 5. Build & start
npm run build
npm install -g pm2
pm2 start npm --name "resume-shapeshifter" -- start
pm2 save
pm2 startup

# 6. Set up reverse proxy (Nginx)
sudo apt-get install -y nginx
```

### 5.3 Nginx Configuration

Create `/etc/nginx/sites-available/resume-shapeshifter`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/resume-shapeshifter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 6. Environment Variables Reference

| Variable             | Required | Description                          | Example                    |
|----------------------|----------|--------------------------------------|----------------------------|
| `GROQ_API_KEY`       | Yes      | Groq API key for LLM calls           | `gsk_PH6O...`              |
| `NEXT_PUBLIC_API_URL`| No       | Custom API base URL (default: `/`)   | `https://api.example.com`  |

### Groq API Rate Limits

| Plan      | Requests/min | Tokens/min | Suitable For |
|-----------|-------------|------------|--------------|
| Free      | 30          | 20,000     | ✅ Demo/testing |
| Paid      | 100+        | 100,000+   | ✅ Production  |

---

## 7. Post-Deployment Checklist

After deployment, verify the following:

### 7.1 Basic Checks

- [ ] Landing page loads at `https://your-domain.vercel.app`
- [ ] "Try with sample data" button pre-fills both text areas
- [ ] Clicking "Analyze Match" navigates to `/analysis`
- [ ] Loading state shows progress for each step
- [ ] Score, gap analysis, and JD summary render correctly

### 7.2 API Health Check

```bash
# Test parse-resume endpoint
curl -X POST https://your-domain.vercel.app/api/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"text": "Alex Chen\nalex@email.com\n\nSkills: JavaScript, React\n\nExperience:\nCompany XYZ\nDeveloper\n- Built web apps"}'

# Expected: 200 with structured ResumeProfile
```

### 7.3 PDF Export Test

- [ ] "Download Tailored Resume (PDF)" triggers a PDF download
- [ ] Downloaded PDF opens correctly and shows all sections
- [ ] "Download Side-by-Side (PDF)" works
- [ ] "Download as Markdown" works

### 7.4 Error Handling Checks

- [ ] Empty text inputs show validation messages
- [ ] Network errors show friendly error messages
- [ ] Low-confidence bullets show "Accept/Reject" buttons
- [ ] Export is blocked when low-confidence changes aren't confirmed

### 7.5 Performance Checks

- [ ] First page load (cold start) < 3 seconds
- [ ] Parsing endpoints respond < 5 seconds
- [ ] Tailoring endpoint responds < 30 seconds
- [ ] Page transitions feel smooth (no jank)

---

## 8. Monitoring & Maintenance

### 8.1 Vercel Analytics

Enable in Vercel Dashboard:
1. **Project → Analytics → Enable**
   - Web Analytics (page views, visit duration)
   - Speed Insights (Core Web Vitals)

### 8.2 Logging

Vercel provides built-in logging:
- **Project → Logs → Runtime Logs**
- Filter by status codes (500 errors, 504 timeouts)
- Search for `[LLM]` to track token usage per request

### 8.3 Cost Monitoring

Estimated per-run token usage (Groq):

| Step              | Avg Tokens | Cost (approx) |
|-------------------|------------|---------------|
| Resume Parsing    | ~1,500     | Free (Groq)   |
| JD Parsing        | ~1,000     | Free (Groq)   |
| Match Scoring     | ~950       | Free (Groq)   |
| Gap Analysis      | ~1,650     | Free (Groq)   |
| Tailoring         | ~1,200     | Free (Groq)   |
| **Total/run**     | **~6,300** | **Free**      |

> **Note:** Groq's free tier provides 20,000 tokens/min — sufficient for ~3 analysis runs per minute.

### 8.4 Updating

```bash
# Pull latest changes
git pull origin main

# Redeploy to Vercel
vercel --prod

# Or if using Docker
docker compose build
docker compose up -d
```

---

## 9. Troubleshooting

### 9.1 Build Failures

| Error                                          | Cause                                  | Fix                                      |
|------------------------------------------------|----------------------------------------|------------------------------------------|
| `GROQ_API_KEY is missing or empty`             | No API key during build                | Made Groq client lazy-initialized (done) |
| `TypeError: Cannot read properties of undefined` | `@react-pdf` render prop issue       | Changed footer to static text (done)     |
| `Module not found: @/components/ui/tooltip`    | Missing shadcn component               | Run `npx shadcn@latest add tooltip`      |
| `TypeScript error`                             | Type mismatch                          | Check type definitions in `schemas.ts`   |

### 9.2 Runtime Errors

| Error                                          | Cause                                  | Fix                                      |
|------------------------------------------------|----------------------------------------|------------------------------------------|
| `POST /api/score 502`                          | LLM validation error                   | Check prompt schemas match Zod schemas   |
| `POST /api/tailor 502`                         | Bullet rewriter fails                  | Fallback to original bullets (built-in)  |
| `POST /api/export-pdf 500`                     | PDF rendering height error             | Avoid `position: absolute` + `render`    |
| Page takes >30s to load                        | Cold start on free tier                | Upgrade to Vercel Pro or use cron warmup |
| `429 Too Many Requests`                        | Groq rate limit hit                    | Wait 2 seconds, retry (auto-retry)       |

### 9.3 Vercel-Specific Issues

**Issue:** "The `GROQ_API_KEY` environment variable is missing" during build  
**Fix:** Already resolved — Groq client now uses lazy initialization. API keys are only accessed at runtime, not build time.

**Issue:** Serverless function timeout for `/api/tailor`  
**Fix:** 
- On Hobby plan (10s timeout): Consider splitting tailoring into smaller chunks, or upgrade to Pro (60s timeout)
- The tailor endpoint may take 15–35s on average

**Issue:** PDF generation fails on serverless  
**Fix:** 
- Ensure `serverExternalPackages: ["@react-pdf/renderer"]` in `next.config.ts`
- Avoid absolute positioning in PDF templates

---

## 10. Rollback Strategy

### 10.1 Vercel Rollback

```bash
# List all deployments
vercel list

# Rollback to a specific deployment
vercel rollback <deployment-id>

# Or via Dashboard:
# Project → Deployments → Find deployment → ⋮ → Rollback
```

### 10.2 Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to a specific version
git reset --hard <commit-hash>
git push --force origin main
```

### 10.3 Docker Rollback

```bash
# Rollback to previous image
docker-compose down
docker-compose up -d --no-build
# (uses previously built image)
```

---

## Appendix A: Quick Deploy Checklist

```
□ Vercel CLI installed (`npm install -g vercel`)
□ `npm run build` passes locally
□ Groq API key obtained (https://console.groq.com)
□ Environment variables configured on Vercel
  └─ GROQ_API_KEY = gsk_...
□ Domain configured (optional)
  └─ Custom domain added in Vercel Dashboard
□ SSL auto-provisioned by Vercel
□ Post-deployment tests passed (see Section 7)
□ Monitoring enabled (Vercel Analytics)
```

## Appendix B: Useful Commands

```bash
# Development
npm run dev           # Start dev server on :3000
npm run build         # Production build
npm run lint          # Run ESLint

# Vercel
vercel                # Deploy to preview
vercel --prod         # Deploy to production
vercel logs           # View runtime logs
vercel env pull       # Pull env vars locally

# Docker
docker compose up     # Start with Docker
docker compose build  # Rebuild Docker image
```

---

> **End of Deployment Plan**
>
> Next step: Deploy to Vercel using instructions in Section 3, then run through the Post-Deployment Checklist (Section 7).