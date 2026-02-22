# 🚀 KOLOR STUDIO - Running on Emergent Platform

## Quick Start (2 Commands!)

### Option 1: Automated Setup (Recommended)

Run this single command to install everything:

```bash
cd /home/claude/kolor-studio-v2 && bash setup.sh
```

This will:
- ✅ Install all backend dependencies
- ✅ Install all frontend dependencies  
- ✅ Set up SQLite database (no PostgreSQL needed!)
- ✅ Generate Prisma client
- ✅ Create .env file

**Then start the servers:**

```bash
# Terminal 1 - Backend
cd /home/claude/kolor-studio-v2/backend
npm run dev
```

```bash
# Terminal 2 - Frontend (open new terminal)
cd /home/claude/kolor-studio-v2/frontend
npm run dev
```

---

### Option 2: Manual Setup

If you prefer to do it step-by-step:

#### Backend Setup

```bash
cd /home/claude/kolor-studio-v2/backend

# Install dependencies
npm install

# Create .env file (using SQLite for simplicity)
cat > .env << 'EOF'
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-$(date +%s)"
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
EOF

# Generate Prisma client and create database
npx prisma generate
npx prisma migrate dev --name init

# Start server
npm run dev
```

#### Frontend Setup (New Terminal)

```bash
cd /home/claude/kolor-studio-v2/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 🎯 What You'll See

### Backend (Terminal 1)
```
🚀 KOLOR STUDIO API Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: development
🌐 URL: http://localhost:5000
🏥 Health: http://localhost:5000/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Frontend (Terminal 2)
```
VITE v6.0.3  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🌐 Accessing the App

Once both servers are running, the Emergent platform will provide you with a URL to access your frontend app.

Look for the preview URL in the Emergent interface!

---

## 📝 Notes for Emergent Platform

1. **SQLite Instead of PostgreSQL**: The setup script configures SQLite (file-based database) so you don't need to set up PostgreSQL. Perfect for development!

2. **No External Services Needed**: Everything runs locally in your Emergent container.

3. **File Persistence**: Your database (`backend/dev.db`) will persist as long as your Emergent session is active.

4. **Preview URL**: Emergent will give you a public URL to access your running app.

---

## 🔍 Verify Everything Works

### Test Backend
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "ok",
  "message": "KOLOR STUDIO API is running",
  ...
}
```

### Test Frontend
Visit the Emergent preview URL - you should see the beautiful KOLOR STUDIO landing page!

---

## 🛠️ Development Commands

### Backend
```bash
cd /home/claude/kolor-studio-v2/backend

npm run dev              # Start dev server
npx prisma studio        # Open database GUI (on port 5555)
npx prisma migrate dev   # Run new migrations
```

### Frontend
```bash
cd /home/claude/kolor-studio-v2/frontend

npm run dev              # Start dev server
npm run build            # Build for production
```

---

## 🎨 Project Structure

```
/home/claude/kolor-studio-v2/
├── backend/
│   ├── src/
│   │   └── server.ts          # Main backend file
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── dev.db                 # SQLite database (created after setup)
│   └── .env                   # Config (created by setup)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx    # Beautiful landing page
│       │   ├── Login.tsx          # Login form
│       │   ├── Signup.tsx         # Signup form
│       │   └── Dashboard.tsx      # Dashboard (placeholder)
│       └── App.tsx
│
└── setup.sh                   # Automated setup script
```

---

## ⚡ Quick Troubleshooting

### "Port already in use"
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### "Cannot find module"
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Database issues
```bash
cd /home/claude/kolor-studio-v2/backend
rm -f dev.db
npx prisma migrate dev --name init
```

---

## 🎯 Next Steps

Once everything is running:

1. **Explore the landing page** - See the beautiful UI
2. **Check backend health** - `curl http://localhost:5000/health`
3. **Start building features** - Begin with authentication!

Read `PROJECT_OVERVIEW.md` for the complete roadmap.

---

## 🚀 Ready to Build!

You now have a fully functional development environment running on Emergent.

**Both servers should be running:**
- ✅ Backend API: `http://localhost:5000`
- ✅ Frontend App: Emergent preview URL

**Let's build something amazing!** 🎨✨
