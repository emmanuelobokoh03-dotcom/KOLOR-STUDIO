# 🚀 KOLOR STUDIO - Emergent Platform Setup Guide

Emmanuel, here's how to get KOLOR STUDIO running on the Emergent platform!

---

## 📍 Your Project Location

Your project is at: `/home/claude/kolor-studio-v2`

---

## ⚡ Quick Start on Emergent

### Option 1: Work Directly Here (Recommended)

The project is already in your Emergent environment. You can:

1. **Edit files directly** using the VS Code interface you showed earlier
2. **Run terminal commands** in the Emergent terminal
3. **Install dependencies and run the servers**

### Step-by-Step Setup:

#### 1. Navigate to Backend
```bash
cd /home/claude/kolor-studio-v2/backend
```

#### 2. Install Backend Dependencies
```bash
npm install
```

This will install:
- Express (web server)
- TypeScript (type safety)
- Prisma (database ORM)
- All other backend dependencies

#### 3. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Then edit .env with your values
nano .env
```

**Minimum required in `.env`:**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/kolor_studio"
JWT_SECRET="your-random-secret-here"
FRONTEND_URL=http://localhost:5173
```

#### 4. Set Up Database (You'll Need PostgreSQL)

**Option A: Use Supabase (Free & Easy)**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Paste it as `DATABASE_URL` in your `.env`

**Option B: Local PostgreSQL (if available on Emergent)**
```bash
# Check if PostgreSQL is available
which psql

# Create database
createdb kolor_studio
```

#### 5. Run Database Migrations
```bash
cd /home/claude/kolor-studio-v2/backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init
```

#### 6. Start Backend Server
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

### Frontend Setup

#### 1. Open New Terminal Tab
Keep backend running and open a new terminal

#### 2. Navigate to Frontend
```bash
cd /home/claude/kolor-studio-v2/frontend
```

#### 3. Install Frontend Dependencies
```bash
npm install
```

This installs:
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Framer Motion
- All UI libraries

#### 4. Start Frontend Dev Server
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

## 🌐 Accessing the App

If you're using the VS Code preview in Emergent (like the link you shared earlier):

The app might be accessible through Emergent's preview system at something like:
```
https://quote-fix-1.preview.emergentagent.com/
```

Or you can access it directly if Emergent exposes ports:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 🔧 Working in Emergent

### File Structure in VS Code

You should see:
```
kolor-studio-v2/
├── backend/
│   ├── src/
│   │   └── server.ts        ← Start editing here!
│   ├── prisma/
│   │   └── schema.prisma    ← Database schema
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── LandingPage.tsx  ← Beautiful UI here!
    │   └── App.tsx
    └── package.json
```

### Development Workflow

1. **Edit Code** in VS Code
2. **Server auto-reloads** (backend uses nodemon, frontend uses Vite HMR)
3. **See changes instantly** in the browser
4. **Commit changes** with Git

### Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your message"

# Push to GitHub (if you set up remote)
git push origin main
```

---

## 📋 Troubleshooting on Emergent

### Issue: Network/Download Errors
Emergent might have network restrictions. If `npm install` fails:
```bash
# Try with longer timeout
npm install --fetch-timeout=60000
```

### Issue: Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Issue: Permission Errors
```bash
# Run with sudo if needed
sudo npm install
```

### Issue: Can't Access PostgreSQL
Use Supabase instead - it's cloud-hosted and works from anywhere:
1. Create account at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Paste into `.env` as `DATABASE_URL`

---

## 🎯 Next Steps After Setup

Once both servers are running:

### 1. View the Landing Page
Visit `http://localhost:5173` (or Emergent preview URL)

You should see:
- Beautiful hero section
- Feature cards with animations
- Login/Signup buttons

### 2. Test the Backend
Visit `http://localhost:5000/health`

You should see:
```json
{
  "status": "ok",
  "message": "KOLOR STUDIO API is running",
  "environment": "development"
}
```

### 3. View Database
```bash
cd backend
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to view your database.

### 4. Start Building!

Read `PROJECT_OVERVIEW.md` for the full roadmap.

**First feature to build: Authentication**
- JWT signup/login endpoints
- Connect frontend forms
- Protected routes

---

## 💡 Emergent Platform Tips

### Terminal Usage
```bash
# Split terminal to run both servers
# Terminal 1: Backend
cd /home/claude/kolor-studio-v2/backend && npm run dev

# Terminal 2: Frontend  
cd /home/claude/kolor-studio-v2/frontend && npm run dev
```

### File Editing
- Use VS Code in Emergent for editing
- Auto-complete works with TypeScript
- Prettier formats on save (if configured)

### Debugging
- Backend logs appear in Terminal 1
- Frontend errors in browser console
- Use `console.log()` liberally!

---

## 🚀 You're Ready!

The project is set up and ready to run on Emergent. 

**Quick commands to get started:**
```bash
# Terminal 1
cd /home/claude/kolor-studio-v2/backend
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 2
cd /home/claude/kolor-studio-v2/frontend
npm install
npm run dev
```

**Then visit the app and start building!** 🎨✨

---

Questions? Check the other documentation files:
- `QUICK_START.md` - Fast overview
- `GETTING_STARTED.md` - Detailed setup
- `PROJECT_OVERVIEW.md` - Complete vision & roadmap

**Let's build KOLOR STUDIO!** 💪
