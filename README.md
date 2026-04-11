# JIT Camp

A virtual campground where JITs (your characters) roam, hang out, and make memories together. Features a live activity feed, polaroid photo viewer, avatar creator, and a Windows 95-styled UI.

## Project Structure

```
/
├── backend/    # Express + Socket.io API server
└── frontend/   # React + Vite single-page app
```

## Quick Start

You need two terminals — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev
```

Runs on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in your Supabase credentials + confirm API base URL
npm run dev
```

Opens at `http://localhost:5173`.

## Environment Variables

Both packages have a `.env.example` file. Copy it to `.env` and fill in the values:

**`backend/.env`**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key_here
PORT=3001
```

**`frontend/.env`**
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
VITE_API_BASE=http://localhost:3001
```

Supabase keys are found in your project dashboard under **Project Settings → API**.

## Further Details

- See `backend/README.md` for API routes and backend dependency details.
- See `frontend/README.md` for frontend build commands and dependency details.
