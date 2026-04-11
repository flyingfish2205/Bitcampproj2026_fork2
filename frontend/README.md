# JIT Camp — Frontend

React + Vite single-page app. Requires the backend server to be running.

## Requirements

- Node.js 18+
- Backend server running (see `../backend/README.md`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and fill in your Supabase URL, publishable key, and confirm `VITE_API_BASE` matches the port your backend is running on.

## Running

**Development** (hot-reload dev server):
```bash
npm run dev
```

The app opens at `http://localhost:5173` by default.

**Build for production**:
```bash
npm run build
```

**Preview production build locally**:
```bash
npm run preview
```

## Dependencies

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `socket.io-client` | Real-time connection to the backend for activity feed and new JIT broadcasts |
| `vite` | Dev server and bundler |
| `@vitejs/plugin-react` | React fast-refresh support in Vite |
