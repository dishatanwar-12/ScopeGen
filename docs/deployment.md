# ProposalCraft AI — Production Deployment Guide

This guide details step-by-step instructions for deploying ProposalCraft AI across modern cloud environments (Render, Railway, AWS, Vercel, or Docker Compose).

---

## 1. System Architecture Overview
- **Backend API**: FastAPI (Python 3.11), Uvicorn, SQLAlchemy 2.0 ORM, Alembic migrations.
- **Frontend SPA**: Vite, React 19, TypeScript, Tailwind CSS, served via Nginx or static edge CDN (Vercel, Netlify).
- **Database**: Managed PostgreSQL (or SQLite for local single-node development).
- **AI Inference Engine**: Official NVIDIA NIM hosted inference API (`https://integrate.api.nvidia.com/v1`).
- **Commercial Firewall**: Deterministic backend validation layer preventing hallucination of rates, fees, discounts, and payment terms.

---

## 2. Docker Compose Deployment (Recommended for Self-Hosting)

A production-ready `docker-compose.yml` is provided at the repository root.

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- Valid NVIDIA API Key from [https://build.nvidia.com/](https://build.nvidia.com/)

### Steps

1. **Clone the repository and prepare environment variables**:
   ```bash
   git clone https://github.com/your-org/proposalcraft-ai.git
   cd proposalcraft-ai
   cp .env.example .env
   ```

2. **Configure production secrets in `.env`**:
   ```ini
   APP_ENV=production
   JWT_SECRET_KEY=generate_a_secure_32_char_random_hex_key
   NVIDIA_API_KEY=nvapi-your-real-nvidia-api-key
   NVIDIA_MODEL=meta/llama-3.3-70b-instruct
   FRONTEND_URL=https://proposals.yourcompany.com
   BACKEND_PUBLIC_URL=https://api.yourcompany.com
   ```

3. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify running services**:
   ```bash
   docker compose ps
   curl -f http://localhost:8000/api/v1/system/health
   ```

---

## 3. Managed Cloud Deployment: Render + Vercel

### Part A: Database & Backend on Render

1. **Create Managed PostgreSQL Database**:
   - Navigate to [Render Dashboard](https://dashboard.render.com/) -> New -> PostgreSQL.
   - Name: `proposalcraft-db`.
   - Copy the internal and external **Database URL**.

2. **Deploy FastAPI Backend as a Web Service**:
   - New -> Web Service -> Connect GitHub Repository.
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command:
     ```bash
     pip install -r requirements.txt && alembic upgrade head
     ```
   - Start Command:
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables**:
     - `DATABASE_URL`: `postgresql+asyncpg://user:pass@host:5432/dbname`
     - `APP_ENV`: `production`
     - `JWT_SECRET_KEY`: `your-random-32-byte-hex-string`
     - `NVIDIA_API_KEY`: `nvapi-your-real-key`
     - `NVIDIA_BASE_URL`: `https://integrate.api.nvidia.com/v1`
     - `NVIDIA_MODEL`: `meta/llama-3.3-70b-instruct`
     - `FRONTEND_URL`: `https://your-frontend.vercel.app`
     - `BACKEND_PUBLIC_URL`: `https://your-backend.onrender.com`

3. **Verify Health**:
   - Visit `https://your-backend.onrender.com/api/v1/system/health`.
   - Visit `https://your-backend.onrender.com/docs` to test Swagger UI.

---

### Part B: Frontend on Vercel

1. **Import GitHub Repository on Vercel**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Configure Environment Variables**:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api/v1`

3. **Single Page Application (SPA) Routing Fallback**:
   Ensure `vercel.json` exists in `frontend/`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 4. NVIDIA NIM API Key Rotation

If an NVIDIA API key is compromised:
1. Log into [NVIDIA Build](https://build.nvidia.com/).
2. Under API Keys, generate a replacement token and revoke the compromised token.
3. Update `NVIDIA_API_KEY` in your cloud provider environment settings (Render, Railway, AWS ECS).
4. Restart the backend service. No database migrations or client changes are required.

---

## 5. Production Smoke Testing Checklist

- [ ] **HTTPS Enforced**: Frontend and API endpoints load securely over TLS.
- [ ] **Auth Flow**: New user registers, logs in, and receives valid JWT token.
- [ ] **Tenant Isolation**: User A cannot see or edit clients and projects belonging to User B.
- [ ] **Real NVIDIA NIM Inference**: Verify that `GET /api/v1/system/ai-status` returns `status: connected`.
- [ ] **Pricing Firewall**: Verify that SOWs generated from unpriced packages show *"Pricing not provided — confirmation required"* and never fabricate `$0` or arbitrary amounts.
- [ ] **PDF Download**: Click *"Export PDF"*; verify generated ReportLab PDF opens cleanly.
- [ ] **DOCX Download**: Click *"Export DOCX"*; verify file opens in Microsoft Word / LibreOffice.

