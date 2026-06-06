# MediMate - Smart Medicine Reminder System

A production-ready healthcare SaaS web application for managing medicines, reminders, prescriptions, inventory, and family health monitoring.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Shadcn UI
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** JWT (HTTP-only cookies) + bcrypt
- **Forms:** React Hook Form + Zod
- **State:** Zustand
- **HTTP:** Axios
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Uploads:** Cloudinary (with local fallback)
- **PDF Reports:** jsPDF

## Features

### Authentication
- Register, login, logout, forgot/reset password
- JWT middleware + protected routes
- Role-based access (user/admin)

### Core Modules
- **Dashboard** — stats, adherence charts, upcoming reminders, activity feed
- **Medicines** — full CRUD, search, filter, pagination, detail & edit pages
- **Reminders** — create, taken/missed/snooze actions, date filtering
- **Prescriptions** — Cloudinary upload, OCR placeholder, history
- **Inventory** — stock tracking, low-stock alerts
- **Family** — contact management with edit support
- **Emergency Contacts** — quick-call family contacts
- **Notifications** — in-app alerts with read/delete
- **History & Reports** — adherence logs, analytics, PDF export
- **Profile & Settings** — avatar upload, password change, dark mode, account deletion

### UI
- Premium blue + white healthcare theme
- Sidebar layout + top navbar
- Dark mode, mobile responsive
- Loading skeletons, empty states, toast notifications
- Splash screen + onboarding flow

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional)

### Installation

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register, forgot/reset password
│   ├── (dashboard)/      # Protected app pages
│   ├── api/              # REST API route handlers
│   ├── splash/           # Splash screen
│   └── onboarding/       # Onboarding flow
├── components/           # UI, layout, shared components
├── features/             # Feature-specific UI modules
├── hooks/                # Zustand stores & custom hooks
├── lib/                  # DB, auth, API helpers, Cloudinary
├── models/               # Mongoose schemas
├── services/             # Business logic helpers
├── types/                # TypeScript types
└── validations/          # Zod schemas
```

## API Endpoints

### Auth
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout`
- `GET /api/auth/me` · `POST /api/auth/forgot-password` · `POST /api/auth/reset-password`

### Users
- `GET /api/users/profile` · `PUT /api/users/profile`
- `PUT /api/users/change-password` · `DELETE /api/users/account`

### Medicines
- `GET/POST /api/medicines` · `GET/PUT/DELETE /api/medicines/:id`

### Reminders
- `GET/POST /api/reminders` · `GET/PUT/DELETE /api/reminders/:id`
- `POST /api/reminders/:id/taken` · `POST /api/reminders/:id/missed` · `POST /api/reminders/:id/snooze`

### Prescriptions
- `GET/POST /api/prescriptions` · `GET/DELETE /api/prescriptions/:id`
- `POST /api/prescriptions/upload`

### Inventory
- `GET/POST /api/inventory` · `PUT /api/inventory/:id`

### Family
- `GET/POST /api/family` · `GET/PUT/DELETE /api/family/:id`

### Notifications
- `GET/POST /api/notifications` · `PUT /api/notifications/read/:id`
- `PATCH/DELETE /api/notifications/:id`

### Other
- `GET /api/dashboard` · `GET /api/history` · `GET /api/reports`
- `GET/PUT /api/profile` · `POST /api/upload`

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## License

MIT
