# KOLOR STUDIO v2

> **The CRM that doesn't feel like a CRM.**  
> Built for photographers, designers, and videographers who deserve better than spreadsheets.

---

## 🎨 Vision

KOLOR STUDIO empowers creative professionals to run their businesses with confidence. We're building a platform where:

- **Lead management feels delightful**, not like a chore
- **Client experiences are Instagram-worthy**, not corporate
- **Analytics provide clarity**, not overwhelm
- **Automation works while you create**, not against you

## ✨ The Unfair Advantage

While other CRMs feel like corporate tools, KOLOR STUDIO is designed by creatives, for creatives:

- 🎯 **Visual Pipeline** - Kanban board that shows your entire business at a glance
- 💼 **Client Portal** - Branded experience that makes you look like a million-dollar studio
- 🤖 **Smart Automation** - AI-powered lead scoring and follow-ups
- 📊 **Beautiful Analytics** - Revenue insights that actually help you grow
- ✨ **Instagram-Worthy Design** - Every screen is screenshot-worthy

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** - Type-safe, modern React
- **Vite** - Lightning-fast build tool
- **TailwindCSS** + **shadcn/ui** - Beautiful, accessible components
- **Framer Motion** - Smooth animations
- **React Query** - Server state management
- **Recharts** - Data visualizations

### Backend
- **Node.js** + **Express** - Fast, scalable API
- **TypeScript** - Type safety across the stack
- **PostgreSQL** - Reliable, powerful database
- **Prisma** - Type-safe database ORM
- **SendGrid** - Transactional emails
- **JWT** - Secure authentication

### Infrastructure
- **Frontend**: Vercel (blazing fast CDN)
- **Backend**: Railway/Render (scalable hosting)
- **Database**: Supabase (PostgreSQL + Storage)
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
kolor-studio-v2/
├── frontend/              # React + TypeScript app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Helper functions
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
│
├── backend/               # Express + TypeScript API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database models (Prisma)
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # External services (email, etc.)
│   │   ├── utils/         # Helper functions
│   │   └── server.ts      # Entry point
│   ├── prisma/            # Database schema & migrations
│   └── package.json
│
├── shared/                # Shared TypeScript types
│   └── types/
│
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (or Supabase account)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/emmanuelobokoh03-dotcom/KOLOR-STUDIO.git
cd kolor-studio-v2

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev

# In a new terminal, install frontend dependencies
cd ../frontend
npm install

# Start frontend dev server
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 📋 Development Roadmap

### Phase 1: Foundation ✅ (Week 1)
- [x] Project setup & architecture
- [ ] Database schema design
- [ ] Authentication system (JWT)
- [ ] Basic CRUD API for leads
- [ ] Landing page + routing

### Phase 2: Killer Features 🎯 (Week 2)
- [ ] Kanban pipeline view (drag & drop)
- [ ] Lead detail modal
- [ ] Status management
- [ ] Notes & activity log
- [ ] Search & filtering

### Phase 3: Client Experience 💼 (Week 3)
- [ ] Client portal
- [ ] Real-time messaging
- [ ] File uploads
- [ ] Email notifications
- [ ] Branded templates

### Phase 4: Business Intelligence 📊 (Week 4)
- [ ] Analytics dashboard
- [ ] Revenue tracking
- [ ] Conversion metrics
- [ ] Lead source attribution
- [ ] Export reports

### Phase 5: Polish & Launch 🎨 (Week 5)
- [ ] Mobile responsiveness
- [ ] Animations & micro-interactions
- [ ] Onboarding flow
- [ ] Documentation
- [ ] Production deployment

## 🎨 Design Principles

1. **Brutally Simple** - Every feature must justify its existence
2. **Delightfully Smooth** - Animations should feel natural, not flashy
3. **Photographer-Approved** - Beautiful typography, generous spacing
4. **Data-Driven** - Show insights that help creatives make decisions
5. **Mobile-First** - Manage your business from anywhere

## 📄 License

MIT License - build amazing things!

## 🙏 Built With Love

By Emmanuel Obokoh, for the creative community.

---

**Let's elevate creativity through better business tools.** 🚀
