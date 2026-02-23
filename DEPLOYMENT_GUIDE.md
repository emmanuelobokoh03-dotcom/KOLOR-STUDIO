# KOLOR STUDIO - Deployment Guide

This guide provides step-by-step instructions for deploying KOLOR STUDIO to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Custom Domain Setup](#custom-domain-setup)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub account with access to the KOLOR STUDIO repository
- [ ] Supabase account (database already configured)
- [ ] Railway account (free tier: $5/month credit)
- [ ] Vercel account (free tier)
- [ ] Resend account (for email functionality)
- [ ] Custom domain (optional): kolorstudio.app

---

## Environment Variables

### Backend Environment Variables (Railway)

Create these environment variables in your Railway project:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string from Supabase | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |
| `DIRECT_URL` | Direct database connection (for migrations) | Same as DATABASE_URL |
| `JWT_SECRET` | Secret key for JWT token signing | Generate with: `openssl rand -hex 32` |
| `RESEND_API_KEY` | Resend API key for email sending | `re_xxx` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJxxx` |
| `FRONTEND_URL` | Your frontend URL (for CORS) | `https://kolorstudio.app` or `https://xxx.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Railway sets this automatically) | `8001` |

### Frontend Environment Variables (Vercel)

Create these environment variables in your Vercel project:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://kolor-studio-backend.up.railway.app` |

---

## Database Setup (Supabase)

Your Supabase database should already be configured. If you need to run migrations:

### Run Prisma Migrations
```bash
# SSH into Railway or run locally with DATABASE_URL set
cd backend
npx prisma migrate deploy
```

### Verify Database Schema
```bash
npx prisma studio
```

This opens a visual interface to inspect your database tables.

---

## Backend Deployment (Railway)

### Step 1: Connect Repository
1. Log in to [Railway](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `kolor-studio-v2` repository
4. Railway will auto-detect the Node.js app

### Step 2: Configure Root Directory
Railway deploys from the repo root. The root `package.json` is configured to:
- Install dependencies: `cd backend && npm install`
- Generate Prisma client: `npx prisma generate`
- Build TypeScript: `npm run build`
- Start server: `npm start`

### Step 3: Add Environment Variables
1. Go to your Railway project → **"Variables"** tab
2. Click **"Raw Editor"** and paste:
```
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
JWT_SECRET=your-32-char-secret-here
RESEND_API_KEY=re_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

### Step 4: Deploy
1. Railway auto-deploys on push to main branch
2. Check **"Deployments"** tab for build logs
3. Once deployed, note your Railway URL (e.g., `https://kolor-studio-backend.up.railway.app`)

### Step 5: Run Database Migrations
```bash
# In Railway CLI or via Railway shell
cd backend && npx prisma migrate deploy
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository
1. Log in to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import the `kolor-studio-v2` repository

### Step 2: Configure Build Settings
| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Step 3: Add Environment Variables
1. Go to **"Settings"** → **"Environment Variables"**
2. Add:
```
VITE_API_URL=https://kolor-studio-backend.up.railway.app
```

### Step 4: Deploy
1. Click **"Deploy"**
2. Vercel builds and deploys automatically
3. Note your Vercel URL (e.g., `https://kolor-studio.vercel.app`)

### Step 5: Update Backend CORS
Go back to Railway and update `FRONTEND_URL` to match your Vercel URL.

---

## Custom Domain Setup

### For Vercel (Frontend - kolorstudio.app)
1. Go to Vercel project → **"Settings"** → **"Domains"**
2. Add `kolorstudio.app`
3. Vercel provides DNS records (A record or CNAME)
4. Update your domain registrar's DNS settings:
   - **A Record**: Point `@` to Vercel's IP
   - **CNAME**: Point `www` to `cname.vercel-dns.com`
5. Wait for DNS propagation (up to 48 hours)
6. Vercel auto-provisions SSL certificate

### For Railway (Backend - api.kolorstudio.app)
1. Go to Railway project → **"Settings"** → **"Networking"** → **"Custom Domains"**
2. Add `api.kolorstudio.app`
3. Railway provides a CNAME record
4. Update your domain registrar:
   - **CNAME**: Point `api` to Railway's provided URL
5. Railway auto-provisions SSL certificate

### Update Environment Variables
After custom domain setup:
- **Railway**: Update `FRONTEND_URL` to `https://kolorstudio.app`
- **Vercel**: Update `VITE_API_URL` to `https://api.kolorstudio.app`

---

## Post-Deployment Checklist

### Backend Verification
- [ ] Health check endpoint responds: `curl https://your-backend-url/api/health`
- [ ] Database connection works (check Railway logs)
- [ ] JWT authentication works (test login endpoint)
- [ ] Email sending works (test password reset)

### Frontend Verification
- [ ] Landing page loads correctly
- [ ] Login/signup forms work
- [ ] Dashboard loads for authenticated users
- [ ] Lead management (CRUD) works
- [ ] Quote creation and PDF generation works
- [ ] Client portal is accessible
- [ ] All links navigate correctly

### Security Verification
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly (no cross-origin errors)
- [ ] Environment variables are NOT exposed in browser
- [ ] JWT tokens expire appropriately

### Performance Verification
- [ ] Page load time under 3 seconds
- [ ] API response times under 500ms
- [ ] Images and assets load correctly
- [ ] No console errors in browser

---

## Troubleshooting

### Common Railway Issues

**"npm: command not found"**
- Ensure you're using the root `package.json` that Railway can detect
- Check that `engines.node` is set to `>=18`

**Build fails at Prisma generate**
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Check that Supabase allows connections from Railway's IP

**Application crashes on start**
- Check logs: Railway → Deployments → View Logs
- Verify all environment variables are set
- Ensure `PORT` is not hardcoded (Railway sets it automatically)

### Common Vercel Issues

**Build fails**
- Ensure `Root Directory` is set to `frontend`
- Check that all dependencies are in `package.json`
- Verify TypeScript errors in build logs

**API calls fail**
- Check `VITE_API_URL` is correct
- Verify backend CORS allows your Vercel domain
- Check browser Network tab for actual error

**Environment variables not working**
- Vercel env vars must be prefixed with `VITE_` for client-side access
- Redeploy after changing environment variables

### Database Issues

**Connection refused**
- Check Supabase is not paused (free tier pauses after inactivity)
- Verify connection string format
- Check IP allowlist in Supabase settings

**Migration fails**
- Ensure `DIRECT_URL` is set (required for migrations)
- Check for pending migrations: `npx prisma migrate status`
- Reset if needed: `npx prisma migrate reset` (WARNING: deletes all data)

---

## Production Testing Checklist

### User Flows to Test

1. **Authentication Flow**
   - [ ] Sign up with new email
   - [ ] Login with existing credentials
   - [ ] Password reset flow
   - [ ] Logout functionality

2. **Lead Management**
   - [ ] Create new lead
   - [ ] Edit lead details
   - [ ] Move lead between pipeline stages (drag-and-drop)
   - [ ] Delete lead
   - [ ] Add activity to lead

3. **Quote System**
   - [ ] Create new quote
   - [ ] Add line items
   - [ ] Generate PDF
   - [ ] Send quote to client
   - [ ] View quote in client portal

4. **Client Portal**
   - [ ] Access portal via unique link
   - [ ] View project status
   - [ ] Download quote PDF
   - [ ] QR code generation

5. **Analytics Dashboard**
   - [ ] Pipeline value displays correctly
   - [ ] Revenue chart renders
   - [ ] Statistics are accurate

6. **Email Functionality**
   - [ ] Password reset email sends
   - [ ] Quote email sends
   - [ ] Custom email composer works

---

## Support

For deployment issues:
- Email: support@kolorstudio.com
- Check Railway status: https://status.railway.app
- Check Vercel status: https://www.vercel-status.com
- Check Supabase status: https://status.supabase.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | December 2025 | Initial production deployment guide |

---

**Happy Deploying! 🚀**
