# GAPZERO — AI Research Intelligence Platform

> **"Don't just find answers. Discover what's missing."**

GAPZERO is an AI-native research intelligence platform that maps scientific consensus, cross-domain literature, and identifies critical **negative space** — the unaddressed questions, missing benchmarks, and contradictory hypotheses that existing publications leave behind.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite (JavaScript)
- **Styling**: Tailwind CSS (custom dark SaaS palette `#0B1120`, `#101827`, `#172235`, accent `#38BDF8`)
- **Icons**: Lucide React
- **Visual Analytics**: Recharts
- **HTTP Client**: Axios with JWT request & refresh interceptors
- **Routing**: React Router v6

### Backend
- **Framework**: Python 3 Django 4.2 + Django REST Framework 3.16
- **Database**: SQLite with BigAutoField primary keys
- **Authentication**: DRF SimpleJWT (JSON Web Tokens) with Token Blacklist rotation
- **CORS**: `django-cors-headers` configured for Vite dev server (`http://localhost:5173`)
- **Settings & Security**: `python-decouple` reading strictly from `.env`

### Modular Django Apps
1. **`accounts`**: Custom `User` model, JWT authentication, registration, profiles, password management.
2. **`research`**: Core `ResearchProject` models, research gap metrics, project notes, domain categorization.
3. **`sources`**: Ingested literature papers, preprints, datasets, DOI indexing, and relevance scores.
4. **`analysis`**: Research gap analysis runs, parameter configurations, and discovered hypotheses.
5. **`reports`**: Published intelligence summaries, executive briefs, and exportable reports.
6. **`common`**: Aggregated dashboard statistics, system health checks, shared tags, and activity telemetry.

---

## 📁 Directory Structure

```
devengers/
├── .gitignore
├── README.md
├── venv/                              # Local Python virtual environment
├── gapzero_backend/                   # Django REST Framework Backend
│   ├── .env.example
│   ├── .env
│   ├── requirements.txt
│   ├── manage.py
│   ├── db.sqlite3
│   ├── gapzero_backend/               # Project configuration
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/                      # Auth, User model, JWT views
│   ├── research/                      # ResearchProject, ResearchNote models
│   ├── sources/                       # Literature & dataset tracking
│   ├── analysis/                      # Gap detection execution models
│   ├── reports/                       # Generated report entities
│   └── common/                        # Dashboard stats, health, activity
└── gapzero_frontend/                  # React + Vite Frontend
    ├── .env.example
    ├── .env
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── components/
        │   ├── ui/                    # Button, Card, Badge, Input, Modal, etc.
        │   └── layout/                # Navbar, Sidebar
        ├── pages/                     # Dashboard, Projects, ProjectDetail, Login, etc.
        ├── layouts/                   # DashboardLayout, AuthLayout
        ├── services/                  # authService, projectService, dashboardService
        ├── hooks/                     # useAuth
        ├── context/                   # AuthContext (JWT session management)
        └── utils/                     # Axios instance with JWT interceptors
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd gapzero_backend

# Create and activate virtual environment (if not already using the root venv)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations
python manage.py makemigrations accounts research sources analysis reports common
python manage.py migrate

# Seed sample research projects and default admin researcher
python manage.py seed_data

# Run Django unit tests
python manage.py test accounts research common

# Start the Django development server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to the frontend directory
cd gapzero_frontend

# Install node dependencies
npm install

# Configure environment variables
cp .env.example .env

# Verify production build
npm run build

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173/` and communicate with the backend at `http://127.0.0.1:8000/`.

---

## 🔑 Default Credentials (Seed Data)

The database includes an initial administrator researcher account:
- **Email**: `admin@gapzero.ai`
- **Password**: `gapzero123`
- *(An "Auto Fill" button is also provided directly on the Login page for convenience).*

---

## 🌐 API Route Catalog

All endpoints are versioned under `/api/v1/`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/common/health/` | API health check & version | No |
| `POST` | `/api/v1/auth/register/` | Register new researcher account | No |
| `POST` | `/api/v1/auth/login/` | Obtain JWT access + refresh tokens | No |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh expired access token | No |
| `GET` | `/api/v1/auth/profile/` | Retrieve authenticated user profile | Yes (Bearer JWT) |
| `PATCH` | `/api/v1/auth/profile/` | Update authenticated user profile | Yes (Bearer JWT) |
| `POST` | `/api/v1/auth/logout/` | Blacklist refresh token & logout | Yes (Bearer JWT) |
| `GET` | `/api/v1/common/dashboard/stats/` | Aggregated metrics for dashboard | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/` | List accessible research projects | Yes (Bearer JWT) |
| `POST` | `/api/v1/research/projects/` | Create new `ResearchProject` | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/:id/` | Retrieve detailed research project | Yes (Bearer JWT) |
| `PATCH` | `/api/v1/research/projects/:id/` | Update research project | Yes (Bearer JWT) |
| `DELETE` | `/api/v1/research/projects/:id/` | Delete research project (owner only) | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/stats/` | Project counts by status & domain | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/:id/notes/` | List research notes for a project | Yes (Bearer JWT) |
| `POST` | `/api/v1/research/projects/:id/notes/` | Add note to research project | Yes (Bearer JWT) |
| `GET` | `/api/v1/sources/?project=:id` | List ingested literature sources | Yes (Bearer JWT) |
| `POST` | `/api/v1/sources/` | Register literature source/paper | Yes (Bearer JWT) |
| `GET` | `/api/v1/analysis/?project=:id` | List gap detection analyses | Yes (Bearer JWT) |
| `POST` | `/api/v1/analysis/` | Queue new negative-space analysis | Yes (Bearer JWT) |
| `GET` | `/api/v1/reports/?project=:id` | List synthesized reports | Yes (Bearer JWT) |
| `POST` | `/api/v1/reports/` | Generate research report | Yes (Bearer JWT) |

---

## 🧪 Test Results

The backend test suite (`python manage.py test accounts research common`) verifies:
- User registration with password validation
- JWT token generation & claims (`access`, `refresh`, user payload)
- Authenticated profile retrieval
- `ResearchProject` model creation and owner relationship
- Filtering projects by domain, status, and search query
- Aggregated project telemetry & status statistics
- Project note creation and pinning

```text
Found 7 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
.......
----------------------------------------------------------------------
Ran 7 tests in 2.028s

OK
Destroying test database for alias 'default'...
```
