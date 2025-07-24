# Perdami Store App

A comprehensive e-commerce platform built with Next.js 15, featuring admin management, customer shopping, and product bundles.

## 🚀 Features

### Admin Dashboard
- **Bundle Management**: Create and manage product bundles with drag & drop functionality
- **Order Management**: Track orders, update status, and handle customer communications
- **User Management**: Manage customers and admin accounts
- **Store Management**: Multi-store support with individual store management
- **Analytics**: Dashboard with sales analytics and reports
- **Dark Mode**: Full dark mode support across all interfaces

### Customer Features
- **Product Browsing**: Browse products and bundles by store
- **Shopping Cart**: Add to cart with real-time updates
- **Checkout Process**: Streamlined checkout with payment integration
- **Order Tracking**: Track order status and history
- **Profile Management**: Manage personal information and preferences
- **Notifications**: Real-time notifications for order updates

### Product Management
- **Bundle Creation**: Advanced bundle management with drag & drop item ordering
- **Image Uploads**: Support for product and bundle images
- **Inventory Tracking**: Stock management and availability tracking
- **Category Management**: Organize products by categories

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credential and social providers
- **File Upload**: Image upload and management
- **Email**: Email notifications and verification
- **Drag & Drop**: @dnd-kit for advanced interactions

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yasunstudio/perdami-store-app.git
   cd perdami-store-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/perdami_store"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🐳 Docker Setup

You can run the application using Docker:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

## 📋 Default Accounts

After seeding the database, you can use these accounts:

- **Admin**: admin@perdami.com / admin123
- **Customer**: customer@perdami.com / customer123

## 🎯 Key Features Implemented

### Bundle Management System
- Drag & drop item reordering
- Real-time validation
- Responsive design for all devices
- Dark mode support
- Professional UI/UX

### Admin Interface
- Consistent action menus
- Toggle functionality for bundle states
- Enhanced data presentation
- Sticky navigation with proper scroll handling
- Professional error handling

### Customer Experience
- Streamlined checkout process
- Real-time cart updates
- Order tracking and history
- Responsive design
- Accessibility compliant

## 🚀 Deployment

The application is ready for deployment on platforms like:

- **Vercel**: Optimized for Next.js applications
- **Railway**: Database and application hosting
- **Docker**: Containerized deployment
- **Traditional VPS**: Using Docker Compose

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate dev` - Run database migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- UI components from shadcn/ui
- Icons from Lucide React
- Database ORM by Prisma
