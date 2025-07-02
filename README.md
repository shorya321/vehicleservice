# Vehicle Service Platform

A comprehensive vehicle service management system with role-based access for administrators, customers, vendors, and drivers.

## Features

- 🔐 **Role-Based Authentication**: Separate access for admin, customer, vendor, and driver users
- 🎨 **Modern UI/UX**: Beautiful admin panel with dark/light mode support
- 📊 **Real-time Dashboard**: Track bookings, revenue, and business metrics
- 🔒 **Secure**: Built with Supabase for secure authentication and data storage

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with Shadcn UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with role-based access
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vehicleservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Database Setup**
   - Run the migration in `supabase/migrations/001_user_roles.sql` in your Supabase SQL editor
   - This creates the user roles system and profiles table

5. **Create Admin User** (Optional)
   ```bash
   npx tsx scripts/setup-admin.ts
   ```
   This creates a test admin user:
   - Email: admin@vehicleservice.com
   - Password: admin123456

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
vehicleservice/
├── app/
│   ├── admin/          # Admin panel pages (protected)
│   │   ├── login/      # Admin login page
│   │   └── page.tsx    # Admin dashboard
│   ├── customer/       # Customer portal (future)
│   ├── vendor/         # Vendor portal (future)
│   ├── driver/         # Driver portal (future)
│   └── page.tsx        # Landing page
├── components/
│   ├── layout/         # Layout components (sidebar, header)
│   └── ui/             # Reusable UI components
├── lib/
│   └── supabase/       # Supabase client configurations
├── supabase/
│   └── migrations/     # Database migrations
└── middleware.ts       # Authentication middleware
```

## User Roles

- **Admin**: Full system access, user management, reports
- **Customer**: Book services, track orders, manage profile
- **Vendor**: Manage services, view bookings, update availability
- **Driver**: View assignments, update delivery status

## Access URLs

- Landing Page: [http://localhost:3001](http://localhost:3001)
- Admin Login: [http://localhost:3001/admin/login](http://localhost:3001/admin/login)
- Admin Dashboard: [http://localhost:3001/admin](http://localhost:3001/admin) (requires admin login)

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Admin Pages

1. Create a new file in `app/admin/[page-name]/page.tsx`
2. The page will automatically be protected by authentication middleware
3. Update the sidebar navigation in `components/layout/sidebar.tsx`

### Theme Customization

- Theme configuration: `app/globals.css`
- Color variables support light/dark modes
- Component variants in `components/ui/`
- See `THEME_GUIDE.md` for detailed theming documentation

## Security

- All admin routes are protected by middleware
- Role-based access control (RBAC) implemented
- Row Level Security (RLS) policies in database
- Service role key only used server-side

## License

This project is licensed under the ISC License.# vehicleservice
