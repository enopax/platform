# Enopax Platform

**Next.js 15 + TypeScript** — infrastructure provisioning platform with file-based storage and OIDC authentication.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start Dex OIDC (via Docker)
npm run dex:up

# Or without Docker (using IDP scripts)
cd ../idp && ./scripts/dex.sh start

# Start Next.js
npm run dev

# Seed sample data (first run only)
npm run seed

# Add a Dex user for login
../idp/scripts/add-user.sh admin admin@enopax.io admin123
```

Open http://localhost:3000 — sign in or register.

### Running Tests

```bash
npm test                           # All tests
npx jest --selectProjects store    # Data store tests
npx jest --selectProjects services # Service layer tests
```

---

## Architecture

```
Next.js App → Store Layer → TinyBase → data/<table>/<id>.json
Next.js App → NextAuth OIDC → Dex → file storage
```

### Key Technologies
- **Framework**: Next.js 15 with App Router and Server Actions
- **Data Storage**: TinyBase v8 with file-per-record persister
- **Authentication**: Dex OIDC (custom fork with file storage)
- **Auth Integration**: NextAuth.js v5 with OIDC provider
- **Styling**: Tailwind CSS + Radix UI
- **Testing**: Jest (243 tests across store, services, actions)

### Data Storage

All data stored as JSON files — no database process required:

```
data/
  users/<id>.json
  users/_index/email.json
  organisations/<id>.json
  projects/<id>.json
  ...
```

See [docs/DATA-STORE.md](./docs/DATA-STORE.md) for full documentation.

### Authentication

- **Provider**: Dex OIDC (`auth.enopax.com` in production, `localhost:5556` in dev)
- **Session**: JWT-based via NextAuth.js
- **Registration**: Platform creates Dex user via gRPC, then redirects to OIDC login
- **Email verification**: Token-based, sent on registration

---

## Project Structure

```
src/
├── app/                     # Next.js pages and layouts
├── components/              # React components
├── lib/
│   ├── store/              # Data store abstraction layer
│   │   ├── types.ts        # All model types
│   │   ├── data-store.ts   # Store singleton
│   │   ├── repositories/   # Interface per model
│   │   └── tinybase/       # TinyBase implementations
│   ├── services/           # Business logic
│   ├── dex/                # Dex gRPC client
│   └── auth.ts             # NextAuth config
├── actions/                 # Server actions
tests/
├── store/                   # Repository + persister tests
└── services/               # Service layer tests
```

---

## Key Features

- **Organisation Management**: hierarchical structure with role-based permissions
- **Name-Based Routing**: `/orga/[orgName]/[projectName]/[resourceName]`
- **Resource Deployment**: one-click provisioning with real-time progress
- **User Registration**: self-service via Dex gRPC + email verification
- **Permission System**: OWNER → ADMIN → MANAGER → MEMBER roles

---

## Production Deployment

Server configuration managed via `enopax.com_setup/` repository (git-push workflow):

- **Platform**: Docker container (`ghcr.io/enopax/platform:latest`)
- **Dex**: Docker container (`ghcr.io/enopax/dex:2.45.1_file_store`)
- **Caddy**: reverse proxy (`enopax.com` → platform, `auth.enopax.com` → Dex)
- **CI/CD**: GitHub Actions builds → GHCR → deploy via SSH

### Environment Variables

```
DEX_ISSUER=https://auth.enopax.com/dex
DEX_CLIENT_ID=enopax-platform
DEX_CLIENT_SECRET=<secret>
AUTH_SECRET=<secret>
AUTH_URL=https://enopax.com
DATA_DIR=/app/data
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [DATA-STORE.md](./docs/DATA-STORE.md) | TinyBase file store, repository pattern, indexes |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, permissions, deployment |
| [COMPONENTS.md](./docs/COMPONENTS.md) | Component structure |
| [DESIGN.md](./docs/DESIGN.md) | UX guidelines |
| [BEST-PRACTICES.md](./docs/BEST-PRACTICES.md) | Development standards |
