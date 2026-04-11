# JIT Camp — Backend

Express + Socket.io API server backed by Supabase.

## Requirements

- Node.js 18+
- A Supabase project with the `tamagotchis` and `activities` tables created

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and fill in your Supabase URL and secret key.

## Running

**Development** (auto-restarts on file changes):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server starts on `http://localhost:3001` by default (configurable via `PORT` in `.env`).

## Dependencies

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `socket.io` | Real-time activity feed and JIT creation broadcasts |
| `@supabase/supabase-js` | Supabase database client |
| `cors` | Cross-origin request handling for the frontend dev server |
| `dotenv` | Loads `.env` into `process.env` |
| `multer` | Multipart file upload handling for avatar images |

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tamagotchis` | List all JITs |
| `POST` | `/api/tamagotchis` | Create a new JIT |
| `GET` | `/api/tamagotchis/:id` | Get a single JIT with best-friend info |
| `GET` | `/api/tamagotchis/:id/activities` | Get activity log for a JIT |
| `PATCH` | `/api/tamagotchis/:id/location` | Update a JIT's world position |
| `GET` | `/api/activities` | Get global activity feed |
| `POST` | `/api/activities` | Log a new activity between two JITs |
| `POST` | `/api/upload` | Upload an avatar image layer |
