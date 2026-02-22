#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║        🎨 KOLOR STUDIO v2 - Setup Script             ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo -e "${RED}❌ Error: Please run this script from the kolor-studio-v2 directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Setting up KOLOR STUDIO...${NC}"
echo ""

# Backend Setup
echo -e "${GREEN}[1/5] Installing backend dependencies...${NC}"
cd backend
if npm install --no-audit --no-fund; then
    echo -e "${GREEN}✅ Backend dependencies installed!${NC}"
else
    echo -e "${RED}❌ Backend installation failed. Check your internet connection.${NC}"
    exit 1
fi
cd ..
echo ""

# Frontend Setup
echo -e "${GREEN}[2/5] Installing frontend dependencies...${NC}"
cd frontend
if npm install --no-audit --no-fund; then
    echo -e "${GREEN}✅ Frontend dependencies installed!${NC}"
else
    echo -e "${RED}❌ Frontend installation failed. Check your internet connection.${NC}"
    exit 1
fi
cd ..
echo ""

# Environment Setup
echo -e "${GREEN}[3/5] Setting up environment variables...${NC}"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Created backend/.env from example${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your database credentials!${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Git Setup
echo -e "${GREEN}[4/5] Checking Git configuration...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Git not initialized. Run: git init${NC}"
fi
echo ""

# Database Check
echo -e "${GREEN}[5/5] Checking Prisma setup...${NC}"
cd backend
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema found${NC}"
    echo -e "${YELLOW}📝 Next step: Run 'npx prisma generate' after setting up database${NC}"
else
    echo -e "${RED}❌ Prisma schema not found${NC}"
fi
cd ..
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║              ✅ Setup Complete!                       ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo ""
echo "1. Set up your database (Supabase recommended):"
echo "   → Visit https://supabase.com"
echo "   → Create a new project"
echo "   → Copy the connection string"
echo ""
echo "2. Edit backend/.env with your database URL:"
echo "   → nano backend/.env"
echo "   → Set DATABASE_URL and JWT_SECRET"
echo ""
echo "3. Run database migrations:"
echo "   → cd backend"
echo "   → npx prisma generate"
echo "   → npx prisma migrate dev --name init"
echo ""
echo "4. Start the backend server:"
echo "   → cd backend"
echo "   → npm run dev"
echo ""
echo "5. In a new terminal, start the frontend:"
echo "   → cd frontend"
echo "   → npm run dev"
echo ""
echo "6. Visit http://localhost:5173 to see your app!"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "   → EMERGENT_SETUP.md - Platform-specific guide"
echo "   → QUICK_START.md - Quick overview"
echo "   → PROJECT_OVERVIEW.md - Complete roadmap"
echo ""
echo -e "${GREEN}🚀 Ready to build something amazing!${NC}"
echo ""
