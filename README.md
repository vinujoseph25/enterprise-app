# Enterprise React Platform

> A React + TypeScript project scaffold and tooling reference for scalable enterprise web applications — currently an early-stage architecture reference, not a finished product.

The **Enterprise React Platform** is where I'm working out how I'd structure a large React application so that build tooling, delivery pipeline, and engineering quality gates are production-grade from day one — before layering on business features.

## Status: early-stage scaffold

Be upfront about where this actually is: the build system, CI/CD, tooling, and delivery setup below are real and working. The application layer is currently a single mock dashboard built with plain React state — none of the richer client/server-state stack (Redux Toolkit, TanStack Query, AG Grid, D3, i18next, Sentry) is wired into working features yet. Those libraries are declared as dependencies and documented as the intended architecture (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)), but that document describes a plan, not what's currently implemented.

## What's actually built

- Full webpack build pipeline (dev/prod configs, custom chunk-analysis and optimization plugins, bundle analysis tooling)
- Docker + Nginx delivery setup, with dev and prod compose files
- GitHub Actions CI workflow, plus a separate Dependabot workflow
- ESLint, Prettier, Husky pre-commit/pre-push hooks, Commitlint with conventional-commit enforcement
- Jest + React Testing Library configured, with a coverage threshold set (70%)
- A documented folder structure and architectural plan (`docs/ARCHITECTURE.md`, `docs/CODE_SPLITTING_GUIDE.md`) for how features, state, and services are meant to be organised as the app grows
- One working feature: a mock operational dashboard (`src/features/dashboard`) rendering static service-health data through plain `useState`/`useEffect` and a typed service boundary (`platformService.ts`)

## What's planned, not yet implemented

The dependency list below reflects the intended stack — none of it is wired into `src/` yet:

| Area | Planned technology |
| --- | --- |
| Client state | Redux Toolkit |
| Server state | TanStack Query |
| Data grids | AG Grid, MUI X Data Grid |
| Visualisation | Recharts, D3, Apache ECharts |
| Forms | Formik, Yup |
| Internationalisation | i18next, react-i18next |
| Observability | Sentry, PostHog |

Most `src/` feature folders (`auth`, `profile`, `store/slices`, `services/api`, `locales`, etc.) exist as placeholders (`.gitkeep`) rather than implemented code.

## Project structure

```text
src/
├── assets/          # Application assets
├── components/      # Shared presentation components
├── config/          # Runtime/application configuration
├── context/         # Cross-cutting providers
├── errorBoundary/   # Resilience and error handling
├── features/        # Business capabilities (dashboard implemented; others are placeholders)
├── hooks/           # Shared custom hooks
├── layouts/         # Application layouts
├── locales/         # Translation resources
├── middlewares/     # Cross-cutting middleware
├── pages/           # Route-level screens
├── services/        # API/external integrations
├── store/           # Redux store and slices
├── types/           # Shared TypeScript types
└── utils/           # Pure utilities
```

## Getting started

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

```bash
git clone https://github.com/vinujoseph25/enterprise-app.git
cd enterprise-app
npm install
cp .env.local.example .env.local
npm start
```

### Useful commands

```bash
npm start
npm run build
npm run type-check
npm test
npm run test:coverage
npm run lint
npm run format:check
npm run security:audit
npm run build:analyze
```

## Why this project exists

Enterprise frontends become hard to maintain when features, UI, API calls, and global state are tightly coupled. Before writing more features, I wanted the build, delivery, and quality tooling to already reflect how I'd want a real team to work — explicit boundaries, typed contracts, and automated quality gates. That tooling foundation is what's built out here now; the feature layer is next.

## Security

Never commit API keys, credentials, tokens, or production secrets. Use `.env.local.example` as the public configuration contract and keep real values in local or deployment secret stores.

## License

MIT
