# 🚀 Perdami Store - Development Guide

## 🏗️ **Local Development Setup**

### **Quick Start (Recommended)**
```bash
# 1. Clone and setup
git clone https://github.com/yasunstudio/perdami-store-app.git
cd perdami-store-app

# 2. Run setup script
./setup-dev.sh

# 3. Start development server
npm run dev
```

### **Manual Setup**
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# 3. Start PostgreSQL
npm run dev:db

# 4. Setup database
npx prisma migrate dev
npm run db:seed

# 5. Start development
npm run dev
```

## 📋 **Available Scripts**

### **Development**
```bash
npm run dev              # Start Next.js development server
npm run dev:turbo        # Start with Turbopack (faster)
npm run dev:full         # Start everything (DB + App)
```

### **Database**
```bash
npm run dev:db           # Start PostgreSQL only
npm run dev:db:stop      # Stop PostgreSQL
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset and reseed database
npm run db:seed          # Seed database with sample data
```

### **Docker**
```bash
npm run dev:db           # Start local PostgreSQL
npm run dev:db:logs      # View database logs
npm run dev:db:stop      # Stop all services
```

## 🛠️ **Development Workflow**

### **1. Feature Development**
```bash
# Work locally with fast iteration
npm run dev:db          # Start database
npm run dev             # Start app

# Make changes → Auto-reload
# Test features → Instant feedback
# Debug easily → Full access
```

### **2. Testing & Validation**
```bash
# Test build before deployment
npm run build

# Check linting
npm run lint

# Reset database if needed
npm run db:reset
```

### **3. Deployment**
```bash
# Local testing
./deploy.sh local

# Staging (test build)
./deploy.sh staging

# Production (auto-deploy to Vercel)
./deploy.sh production
```

## 🔗 **URLs**

### **Local Development**
- **App**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/login
- **Prisma Studio**: http://localhost:5555

### **Production**
- **App**: https://dharma-wanita-perdami.vercel.app
- **Admin**: https://dharma-wanita-perdami.vercel.app/admin/login

## 🔐 **Admin Credentials**

### **Local & Production**
```
Email: admin@perdami.com
Password: perdami123
```

## 📂 **Database Access**

### **Local PostgreSQL**
```
Host: localhost
Port: 5432
Database: perdami_store_db_dev
Username: perdami_user
Password: perdami_password
```

### **Prisma Studio**
```bash
npm run db:studio
# Opens: http://localhost:5555
```

## 🚀 **Deployment Strategy**

### **Phase 1: Local Development**
- ✅ Fast iteration with Docker PostgreSQL
- ✅ Instant feedback and debugging
- ✅ Full control over environment

### **Phase 2: Production Deployment**
- ✅ Build validation locally
- ✅ Auto-deploy to Vercel
- ✅ Production database (Supabase)

## 🔧 **Troubleshooting**

### **Database Connection Issues**
```bash
# Restart PostgreSQL
npm run dev:db:stop
npm run dev:db

# Reset database
npm run db:reset
```

### **Build Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma
npm run db:generate
```

### **Port Conflicts**
```bash
# Check what's using port 3000
lsof -i :3000

# Check what's using port 5432
lsof -i :5432
```

## 📈 **Performance Tips**

1. **Use Turbopack**: `npm run dev:turbo`
2. **Database Studio**: Keep `npm run db:studio` open
3. **Hot Reload**: Save files auto-reloads browser
4. **Docker Logs**: Monitor with `npm run dev:db:logs`

## 🎯 **Best Practices**

1. **Always test locally first**
2. **Use meaningful commit messages**  
3. **Check build before deploying**
4. **Reset database when schema changes**
5. **Keep .env.local updated**

---

**Happy Coding! 🚀**
