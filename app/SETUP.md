# Perspectives App — Setup Guide

## Prerequisites

- Node.js 24 LTS (install via `nvm install --lts`)

## Setup on a new machine

```bash
cd app
nvm use                           # switch to Node 24 (reads .nvmrc)
npm install                       # install dependencies
```

### Configure credentials

```bash
cp seed.yaml.example seed.yaml
```

Edit `seed.yaml` with your teacher/researcher credentials:

```yaml
users:
  - name: "Your Name"
    password: "your-password"
    role: researcher
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your local paths:

```
DATABASE_URL="file:./perspectives.db"
REFERENCE_LIBRARIES_PATH="/absolute/path/to/configs/reference"
REGISTRY_PATH="/absolute/path/to/registry"
```

### Initialize database

```bash
npx prisma generate               # generate Prisma client
npx prisma db push                # create SQLite database
npx prisma db seed                # seed users, reference libraries, scenarios, test session
```

The seed output will print the test session ID. Note it for testing.

### Run

```bash
npm run dev                       # start dev server at http://localhost:3000
```

## Testing the student view

The seed creates a test session with `ocean_plastic_campaign`. To access it during development:

1. Note the session ID from seed output (e.g., `Session ID: cmndn895o...`)
2. The student session route is protected by `src/proxy.ts`. For dev testing, either:
   - Set a `student-session=test` cookie in your browser (DevTools > Application > Cookies)
   - Or temporarily comment out the student route check in `src/proxy.ts`
3. Visit `http://localhost:3000/student/session/<session-id>`

## After pulling changes

```bash
cd app
nvm use
npm install                       # in case dependencies changed
npx prisma generate               # in case schema changed
npx prisma db push                # sync schema to local db
```

If the schema changed significantly, reset the database:

```bash
rm perspectives.db*               # delete old database
npx prisma db push                # recreate
npx prisma db seed                # re-seed
```

## Key files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (all tables) |
| `prisma/seed.ts` | Seed script (users, reference libs, scenarios, test session) |
| `src/lib/db.ts` | Prisma client singleton |
| `src/app/api/auth/login/route.ts` | Login endpoint (bcrypt + cookie) |
| `src/lib/import.ts` | YAML import logic (used by seed and future dashboard) |
| `src/proxy.ts` | Route protection (Next.js 16 proxy, formerly middleware) |
| `src/app/student/session/[id]/` | Student activity view (Phase 1 core interaction) |
| `src/components/transcript/` | TranscriptView component |
| `src/components/annotation/` | DetectionActPicker, WorkPanel, PhaseIndicator |
| `src/actions/` | Server Actions (annotation CRUD, activity tracking) |

## Current status

- **Phase 2** (project scaffolding): Complete
- **Phase 3a** (core interaction — Phase 1 landscape): Complete
- **Next**: Phase 3b (scaffolds + portrait/tablet mode)

See `docs/implementation-app.md` for the full implementation plan.
