# 🎯 START HERE - KOLOR STUDIO on Emergent

Emmanuel, your complete project is ready at `/home/claude/kolor-studio-v2`

---

## ✅ What You Have Right Now

```
/home/claude/kolor-studio-v2/
├── 📘 EMERGENT_GUIDE.md     ← Read this for Emergent-specific instructions
├── 📘 PROJECT_OVERVIEW.md   ← Full vision, roadmap, and features
├── 📘 GETTING_STARTED.md    ← Detailed setup guide
├── 📘 README.md             ← Project overview
├── 🔧 backend/              ← Express + TypeScript API
└── 💻 frontend/             ← React + TypeScript app
```

---

## ⚡ 3-Step Quick Start

### Step 1: Set Up Database (5 minutes)

Go to **https://supabase.com** in your browser:
1. Sign up (free)
2. Create new project
3. Wait 2 minutes for it to initialize
4. Go to Settings → Database
5. Copy the connection string (starts with `postgresql://`)

### Step 2: Configure Backend (2 minutes)

In your Emergent terminal:

```bash
cd /home/claude/kolor-studio-v2/backend

# Create .env file
cp .env.example .env

# Edit it
nano .env
```

Paste your database URL:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"
JWT_SECRET="make-this-a-long-random-string"
FRONTEND_URL=http://localhost:5173
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Install & Run (5 minutes)

```bash
# Still in /home/claude/kolor-studio-v2/backend

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev --name init

# Start backend
npm run dev
```

**Keep this terminal open!**

---

## 🎨 Start Frontend (New Terminal)

Open a **second terminal** in Emergent:

```bash
cd /home/claude/kolor-studio-v2/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

---

## 🎉 You're Running!

**Backend:** http://localhost:5000  
**Frontend:** http://localhost:5173  

Visit the frontend URL to see your beautiful landing page!

---

## 🛠 Development Workflow

### Terminal 1 (Backend)
```bash
cd /home/claude/kolor-studio-v2/backend
npm run dev  # Keep running
```

### Terminal 2 (Frontend)
```bash
cd /home/claude/kolor-studio-v2/frontend
npm run dev  # Keep running
```

### Terminal 3 (Commands)
```bash
cd /home/claude/kolor-studio-v2
# Use for git, editing files, etc.
```

---

## 📝 Editing Files

### Using Nano (Simple)
```bash
nano backend/src/server.ts
# Edit, then Ctrl+X → Y → Enter to save
```

### Using Vim (Advanced)
```bash
vim backend/src/server.ts
# Press 'i' to insert, ESC to exit insert mode
# Type ':wq' to save and quit
```

---

## 🔄 Git Workflow

```bash
cd /home/claude/kolor-studio-v2

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Describe what you built"

# Push to GitHub
git remote add origin https://github.com/emmanuelobokoh03-dotcom/KOLOR-STUDIO.git
git push -u origin main
```

---

## 🎯 What to Build First

Read `PROJECT_OVERVIEW.md` for the complete roadmap, but here's the priority:

### Week 1: Authentication
- [ ] Backend: Auth endpoints (signup/login)
- [ ] Frontend: Connect login/signup forms
- [ ] Test: User can sign up and log in

### Week 2: Lead Management
- [ ] Backend: Lead CRUD API
- [ ] Frontend: Lead submission form
- [ ] Frontend: Lead list view

### Week 3: Kanban Pipeline
- [ ] Frontend: Drag-and-drop board
- [ ] Backend: Status update endpoints
- [ ] Visual pipeline with animations

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -ti:5000 | xargs kill -9

# Try again
npm run dev
```

### Frontend won't start
```bash
# Check if port is in use
lsof -ti:5173 | xargs kill -9

# Try again
npm run dev
```

### Database error
- Check your DATABASE_URL in `.env`
- Verify Supabase project is active
- Run `npx prisma studio` to test connection

### "npm: command not found"
```bash
# Check Node.js installation
node --version
npm --version
```

---

## 📚 Key Documentation

1. **EMERGENT_GUIDE.md** - How to use this on Emergent
2. **PROJECT_OVERVIEW.md** - Complete vision and roadmap
3. **GETTING_STARTED.md** - Detailed setup instructions
4. **README.md** - Project overview and tech stack

---

## 💡 Quick Tips

1. **Always keep both servers running** (backend + frontend)
2. **Use `npx prisma studio`** to view your database
3. **Check backend terminal** when API calls fail
4. **Hard refresh browser** if changes don't show: `Ctrl+Shift+R`
5. **Commit often** with descriptive messages

---

## 🚀 You're Ready to Build!

Your foundation is solid. The vision is clear. The roadmap is defined.

**Now go build something that helps creatives take control of their business!**

Start with authentication, then leads, then the killer Kanban feature.

One step at a time. One commit at a time.

**You've got this, Emmanuel!** 💪🎨

---

*Questions? Read the other guides. Everything you need is documented.*

**Let's make KOLOR STUDIO the go-to platform for creative professionals!** 🚀✨
