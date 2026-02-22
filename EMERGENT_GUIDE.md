# 🚀 Using KOLOR STUDIO on Emergent Platform

You're already on the Emergent platform! Here's how to work with your project.

---

## 📍 Your Project Location

Your project is at: `/home/claude/kolor-studio-v2`

---

## ⚡ Quick Start on Emergent

### 1. Navigate to the Project
```bash
cd /home/claude/kolor-studio-v2
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

This will take 1-2 minutes. You'll see packages being installed.

### 3. Set Up Your Database

**Option A: Use Supabase (Recommended - Free)**
1. Go to https://supabase.com in another browser tab
2. Sign up for free account
3. Create a new project
4. Go to Settings → Database
5. Copy the "Connection string" (it starts with `postgresql://`)

**Option B: Use a Free PostgreSQL Provider**
- Railway.app
- Render.com
- ElephantSQL.com

### 4. Create Your .env File
```bash
cd /home/claude/kolor-studio-v2/backend

# Copy the example file
cp .env.example .env

# Edit it with nano
nano .env
```

Edit these values:
```env
DATABASE_URL="your-postgresql-connection-string-here"
JWT_SECRET="use-a-random-long-string-here"
FRONTEND_URL=http://localhost:5173
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### 5. Set Up the Database
```bash
cd /home/claude/kolor-studio-v2/backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init
```

### 6. Start the Backend Server
```bash
cd /home/claude/kolor-studio-v2/backend
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

**Keep this terminal running!**

### 7. Install Frontend Dependencies (New Terminal)

Open a new terminal in Emergent, then:
```bash
cd /home/claude/kolor-studio-v2/frontend
npm install
```

### 8. Start the Frontend
```bash
cd /home/claude/kolor-studio-v2/frontend
npm run dev
```

You should see:
```
  VITE v6.0.3  ready in 500 ms
  
  ➜  Local:   http://localhost:5173/
```

### 9. Access Your App

If Emergent provides a preview URL, use that!

Otherwise, the app runs on `http://localhost:5173`

---

## 🛠 Common Commands

### Backend (in `/home/claude/kolor-studio-v2/backend`)
```bash
npm run dev          # Start dev server
npx prisma studio    # Open database GUI
npx prisma migrate   # Run migrations
```

### Frontend (in `/home/claude/kolor-studio-v2/frontend`)
```bash
npm run dev          # Start dev server
npm run build        # Build for production
```

---

## 📂 File Structure Quick Reference

```
/home/claude/kolor-studio-v2/
├── backend/
│   ├── src/
│   │   └── server.ts       # Main backend file
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── .env                # Your secrets (create this!)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Your React pages
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```

---

## 🔧 Editing Files on Emergent

You can edit files using:

**Option 1: Nano (simple terminal editor)**
```bash
nano /home/claude/kolor-studio-v2/backend/src/server.ts
```

**Option 2: Vim (more powerful)**
```bash
vim /home/claude/kolor-studio-v2/backend/src/server.ts
```

**Option 3: VS Code (if available in Emergent)**
Check if Emergent has a VS Code interface or file editor

---

## 🐛 Troubleshooting on Emergent

### "Port already in use"
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### "Command not found: npm"
Node.js might not be installed. Check:
```bash
node --version
npm --version
```

### Database connection fails
- Double-check your DATABASE_URL in `.env`
- Make sure Supabase project is running
- Check if IP is whitelisted in Supabase

### Changes not showing
- Make sure both servers are running
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## 🎯 Next Steps

1. ✅ Get both servers running
2. ✅ Visit the landing page
3. 📖 Read `PROJECT_OVERVIEW.md` for the full roadmap
4. 🔨 Start building authentication (see Phase 1 in docs)

---

## 💡 Pro Tips for Emergent

1. **Keep terminals organized**
   - Terminal 1: Backend server
   - Terminal 2: Frontend server
   - Terminal 3: Commands (git, editing, etc.)

2. **Use tmux for persistent sessions**
   ```bash
   tmux new -s kolor
   # Detach: Ctrl+B then D
   # Reattach: tmux attach -t kolor
   ```

3. **Git workflow**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

---

## 🚀 You're Ready!

Your project is set up and ready to develop on Emergent!

**Start building and let's make KOLOR STUDIO amazing!** 🎨✨

---

Need help? Check the other docs:
- `PROJECT_OVERVIEW.md` - Full vision and roadmap
- `GETTING_STARTED.md` - Detailed setup
- `README.md` - Project overview
