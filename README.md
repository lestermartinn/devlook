# DevLook — Local, Privacy-First Productivity Analytics for Developers

DevLook is a **local-first** dashboard that shows where your time goes (per app/window).  
No cloud, no accounts — just run the agent + backend + optional dashboard on your machine.

## ✨ Features
- Lightweight **Windows agent** (active app + window title, every N seconds)
- **FastAPI backend** with SQLite by default
- **Next.js dashboard** (minutes by app, recent activity, Today/7d/30d)
- Privacy-first: API binds to `127.0.0.1`, data saved locally

## 🚀 Quickstart (Windows)

```powershell
# Clone
git clone https://github.com/lestermartinn/devlook
cd devlook

# Agent
cd agent
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.sample .env
cd ..

# Backend
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.sample .env  # DATABASE_URL=sqlite:///./devlook.db
uvicorn main:app --host 127.0.0.1 --port 8000
# Browse http://127.0.0.1:8000/docs
cd ..

# Frontend (optional)
cd frontend
npm install
npm run dev
# Open http://localhost:3000/ (redirects to /dashboard)
