# School Management System (Monorepo)

An enterprise-ready School Management System architecture built with a strict decoupled design:
- **/backend**: Laravel (Pure REST API, no Blade views, Laravel Sanctum token authentication)
- **/frontend**: React SPA (Vite + Tailwind CSS + TypeScript, client-side routing, no SSR, compiles to static files)

---

## Architecture Overview

```
school-management-system/
├── backend/                  # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php       # Login, Register, Logout, Current User
│   │   │   ├── DashboardController.php  # Institutional metrics & activity log
│   │   │   ├── StudentController.php    # CRUD student records with search/filter
│   │   │   └── CourseController.php     # CRUD course curriculum & enrollment
│   │   └── Models/
│   │       ├── User.php                 # Sanctum HasApiTokens & role
│   │       ├── Student.php              # Student entity & casting
│   │       └── Course.php               # Course entity & credits
│   ├── routes/
│   │   ├── api.php                      # Versioned REST endpoints (Sanctum protected)
│   │   └── web.php                      # Root JSON API spec (Zero Blade views)
│   └── database/
│       └── seeders/DatabaseSeeder.php   # Initial admin & demo data
├── frontend/                 # React SPA (Vite + Tailwind CSS + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx               # Responsive sidebar & header navigation
│   │   │   └── ProtectedRoute.tsx       # Auth guard & token check
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # User state, token persistence, login/logout
│   │   ├── pages/
│   │   │   ├── Login.tsx                # Auth login with 1-click demo filler
│   │   │   ├── Register.tsx             # New administrator / staff registration
│   │   │   ├── Dashboard.tsx            # Live KPI statistics, trends, and activities
│   │   │   ├── Students.tsx             # Live searchable student directory & enrollment
│   │   │   ├── Courses.tsx              # Curriculum catalog & capacity management
│   │   │   └── Settings.tsx             # Account settings & API configuration
│   │   └── services/
│   │       └── api.ts                   # Axios client with Bearer auth interceptors
│   ├── dist/                            # Production static build files (No SSR)
│   └── vite.config.ts                   # Vite configuration with API proxy
└── package.json                         # Root monorepo scripts
```

---

## Quick Start

### 1. Default Credentials

The database is pre-seeded with an administrator account:
- **Email:** `admin@school.com`
- **Password:** `password`

*(Or use the 1-click **Auto-fill** button directly on the login screen).*

---

### 2. Running Backend (`/backend`)

The Laravel backend runs on port `8000`:

```bash
cd backend
php artisan serve --port=8000
```

To re-seed the SQLite database with fresh demo data at any time:
```bash
php artisan migrate:fresh --seed
```

---

### 3. Running Frontend (`/frontend`)

The React SPA runs on Vite on port `5173`:

```bash
cd frontend
npm run dev
```

Open your browser at: [http://localhost:5173](http://localhost:5173)

---

### 4. Building Frontend Static Files

To build the static distribution for production deployment:

```bash
cd frontend
npm run build
```

This compiles optimized static assets (`.html`, `.js`, `.css`) into `frontend/dist/`. No Node.js runtime or SSR is required in production; these static files can be served by Nginx, Cloudflare Pages, S3, or any static host.

---

## REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | No |
| `POST` | `/api/register` | Register a new user | No |
| `POST` | `/api/login` | Login and receive Bearer token | No |
| `GET` | `/api/user` | Fetch authenticated user | Yes (Bearer) |
| `POST` | `/api/logout` | Revoke current token | Yes (Bearer) |
| `GET` | `/api/dashboard/stats` | Summary statistics and recent activity feed | Yes (Bearer) |
| `GET` | `/api/students` | List students (query: `search`, `grade`, `status`) | Yes (Bearer) |
| `POST` | `/api/students` | Enroll a new student | Yes (Bearer) |
| `GET` | `/api/students/{id}` | Get student details | Yes (Bearer) |
| `PUT` | `/api/students/{id}` | Update student record | Yes (Bearer) |
| `DELETE` | `/api/students/{id}` | Delete student record | Yes (Bearer) |
| `GET` | `/api/courses` | List all academic courses | Yes (Bearer) |
| `POST` | `/api/courses` | Create new course entry | Yes (Bearer) |
| `DELETE` | `/api/courses/{id}` | Remove course | Yes (Bearer) |

