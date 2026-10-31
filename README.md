# AGYAAN LAB — AI Research Intelligence Platform

> **"Don't just find answers. Discover what's missing."**

AGYAAN LAB is an AI-native research intelligence platform that maps scientific consensus, cross-domain literature, and identifies critical **negative space** — the unaddressed hypotheses, missing benchmarks, and contradictory claims that existing publications leave behind.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite (JavaScript)
- **Palette**: Clean low-contrast off-white (`#F9F9FB`), pure white surface (`#FFFFFF`), ink black (`#1E2022`), charcoal gray (`#4A4D55`), and clean cobalt accent (`#3B82F6`)
- **Icons**: Lucide React
- **Visual Analytics**: Recharts
- **HTTP Client**: Axios with JWT request & refresh interceptors
- **Routing**: React Router v6

### Backend
- **Framework**: Python 3 Django 4.2 + Django REST Framework 3.16
- **Database**: SQLite with BigAutoField primary keys
- **AI / LLM Engine**: Groq Cloud API (`qwen/qwen3.8-27b` / `openai/gpt-oss-120b`) for real-time negative-space synthesis
- **Literature Search**: OpenAlex Open API (250M+ scholarly works, journals, and preprints)
- **Authentication**: DRF SimpleJWT (JSON Web Tokens) with Token Blacklist rotation
- **CORS**: `django-cors-headers` configured for Vite dev server (`http://localhost:5173`)
- **Settings & Security**: `python-decouple` reading strictly from `.env`

### Modular Django Apps
1. **`accounts`**: Custom `User` model, JWT authentication, registration, profiles, password management.
2. **`research`**: Core `ResearchProject` models, research gap metrics, project notes, domain categorization.
3. **`sources`**: Ingested literature papers, live OpenAlex search, DOI indexing, and relevance scores.
4. **`analysis`**: Real AI gap detection runs powered by Groq LLM.
5. **`reports`**: Publication-grade intelligence briefs generated in GitHub-flavored Markdown.
6. **`common`**: Aggregated dashboard statistics, system health checks, shared tags, and activity telemetry.

---

## 📁 Directory Structure

```text
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
│   ├── sources/                       # Literature tracking & OpenAlex search
│   ├── analysis/                      # Groq AI Gap Detection engine
│   ├── reports/                       # Synthesized intelligence reports
│   └── common/                        # AI client, dashboard stats, health
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
        ├── pages/                     # Dashboard, Projects, ProjectDetail, Sources, Analyses, Reports, Login
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
- Free Groq API Key ([console.groq.com/keys](https://console.groq.com/keys))

### 2. Backend Setup
```bash
# Navigate to backend directory
cd gapzero_backend

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Ensure GROQ_API_KEY is configured in .env

# Run database migrations
python manage.py makemigrations accounts research sources analysis reports common
python manage.py migrate

# Seed sample research projects and admin account
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

# Verify production build
npm run build

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173/` and communicate with the backend at `http://127.0.0.1:8000/`.

---

## 🔑 Default Credentials (Seed Data)

The database includes an initial administrator researcher account:
- **Email**: `admin@agyaanlab.ai`
- **Password**: `agyaanlab123`
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
| `POST` | `/api/v1/auth/logout/` | Blacklist refresh token & logout | Yes (Bearer JWT) |
| `GET` | `/api/v1/common/dashboard/stats/` | Aggregated metrics for dashboard | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/` | List accessible research projects | Yes (Bearer JWT) |
| `POST` | `/api/v1/research/projects/` | Create new `ResearchProject` | Yes (Bearer JWT) |
| `GET` | `/api/v1/research/projects/:id/` | Retrieve detailed research project | Yes (Bearer JWT) |
| `GET` | `/api/v1/sources/search-online/?query=...` | Search live papers on OpenAlex | Yes (Bearer JWT) |
| `POST` | `/api/v1/sources/import-paper/` | Import paper into a project | Yes (Bearer JWT) |
| `POST` | `/api/v1/analysis/run-gap-analysis/` | Run real Groq AI Gap Detection | Yes (Bearer JWT) |
| `POST` | `/api/v1/reports/generate/` | Generate publication-grade Markdown brief | Yes (Bearer JWT) |

---

## 🧪 Test Results

The backend test suite (`python manage.py test accounts research common`) verifies:
- User registration and JWT authentication
- Authenticated profile retrieval
- `ResearchProject` model creation and owner relationship
- Filtering projects by domain, status, and query
- Note creation and pinning

```text
Found 7 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
.......
----------------------------------------------------------------------
Ran 7 tests in 2.138s

OK
Destroying test database for alias 'default'...
```
