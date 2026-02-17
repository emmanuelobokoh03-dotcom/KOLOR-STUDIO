# 🚀 Getting Started with KOLOR STUDIO

Welcome to KOLOR STUDIO v2! This guide will get you up and running in minutes.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL** - Use [Supabase](https://supabase.com) for free PostgreSQL (recommended)
- **Git** - For version control
- **Code editor** - VS Code recommended

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/emmanuelobokoh03-dotcom/KOLOR-STUDIO.git
cd kolor-studio-v2
```

---

## Step 2: Set Up Backend

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=5000
NODE_ENV=development

# Get this from Supabase (free): https://supabase.com
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Generate a random secret: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Get this from SendGrid (free): https://sendgrid.com
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=hello@kolorstudio.com
SENDGRID_FROM_NAME="KOLOR STUDIO"

FRONTEND_URL=http://localhost:5173
```

### Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 KOLOR STUDIO API Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: development
🌐 URL: http://localhost:5000
🏥 Health: http://localhost:5000/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 3: Set Up Frontend

Open a **new terminal window** (keep backend running):

```bash
cd frontend
npm install
```

### Start Frontend Dev Server

```bash
npm run dev
```

You should see:
```
  VITE v6.0.3  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 4: Visit the App

Open your browser and go to:
👉 **http://localhost:5173**

You should see the beautiful KOLOR STUDIO landing page! 🎉

---

## Quick Checklist

- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Database connected (check with `npx prisma studio`)
- [ ] Landing page loads successfully

---

## Next Steps

Now that you have the foundation running, here's what we'll build:

### Phase 1 - This Week
1. ✅ Authentication (signup/login with JWT)
2. ✅ Lead CRUD API (create, read, update, delete)
3. ✅ Dashboard layout
4. ✅ Lead submission form

### Phase 2 - Next Week
1. 🎯 Kanban pipeline view (drag & drop)
2. 📝 Lead detail modal
3. 🔍 Search & filtering
4. 📊 Basic analytics

---

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use: `lsof -i :5000`
- Verify DATABASE_URL is correct in `.env`
- Run `npx prisma generate` again

### Frontend won't start
- Check if port 5173 is already in use: `lsof -i :5173`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

### Database connection fails
- Verify Supabase credentials
- Check if your IP is allowed in Supabase dashboard
- Test connection: `npx prisma db pull`

### "Module not found" errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Restart the dev server

---

## Development Workflow

### Making Changes

1. **Backend changes** (API routes, database):
   - Edit files in `backend/src/`
   - Server auto-restarts (nodemon)
   - Test with Postman or Thunder Client

2. **Frontend changes** (UI, components):
   - Edit files in `frontend/src/`
   - Hot reload in browser
   - See changes instantly

3. **Database schema changes**:
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name describe_your_change
   npx prisma generate
   ```

---

## Useful Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npx prisma studio    # Open database GUI
npx prisma migrate   # Run database migrations
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Project Structure Quick Reference

```
kolor-studio-v2/
├── backend/
│   ├── src/
│   │   ├── routes/         ← API endpoints
│   │   ├── controllers/    ← Business logic
│   │   ├── middleware/     ← Auth, validation
│   │   └── server.ts       ← Entry point
│   ├── prisma/
│   │   └── schema.prisma   ← Database schema
│   └── .env                ← Config (DO NOT COMMIT)
│
├── frontend/
│   ├── src/
│   │   ├── components/     ← Reusable UI components
│   │   ├── pages/          ← Route pages
│   │   ├── services/       ← API calls
│   │   └── App.tsx         ← Main component
│   └── tailwind.config.js  ← Styling config
│
└── README.md
```

---

## Ready to Build?

You're all set! The foundation is ready.

**What we'll build next:**
1. Authentication system (JWT)
2. Lead management API
3. Beautiful Kanban board
4. Client portal
5. Analytics dashboard

Let's create something amazing! 🚀

---

Need help? Check the main README or reach out to Emmanuel.
