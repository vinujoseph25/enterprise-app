# Enterprise React Platform

A production-oriented React + TypeScript reference architecture for scalable enterprise web applications.

This repository demonstrates how I approach frontend systems that need to remain maintainable as teams, features, data volumes and operational requirements grow.

## Architecture at a glance

```text
Routes / Pages
      ↓
Feature modules
      ↓
UI + domain orchestration
      ↓
Client state      Server state
Redux Toolkit     TanStack Query
      ↓                 ↓
        Service / API boundary
                 ↓
          External systems
```

The implementation separates **business features, presentation, client state, server state, service integration and cross-cutting concerns**. The intention is to demonstrate architectural judgement rather than produce another generic React starter.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architectural decisions, trade-offs, testing strategy, performance approach and delivery model.

## What this demonstrates

- Feature-oriented React architecture for scalable teams
- Strict TypeScript and explicit domain models
- Redux Toolkit for client/application state
- TanStack Query for server state, caching and request lifecycle
- Reusable UI, hooks, services and utilities
- Enterprise data-grid and dashboard patterns
- Error boundaries, loading states and defensive UI
- Internationalisation-ready structure
- Unit and component testing with Jest and React Testing Library
- Mockable service boundaries for integration testing
- Code quality automation with ESLint, Prettier, Husky and commit conventions
- Docker and CI/CD-oriented delivery structure
- Performance practices including code splitting, virtualisation and bundle analysis
- Security-conscious environment configuration

## Architecture

```text
src/
├── assets/          # Application assets
├── components/      # Reusable presentation components
├── config/          # Runtime and application configuration
├── context/         # Cross-cutting React providers
├── errorBoundary/   # Resilience and error handling
├── features/        # Business capabilities / feature modules
├── hooks/           # Shared custom hooks
├── layouts/         # Application layouts
├── locales/         # Translation resources
├── middlewares/     # Cross-cutting middleware
├── pages/           # Route-level screens
├── services/        # API and external service integrations
├── store/           # Redux state and slices
├── types/           # Shared TypeScript types
└── utils/           # Pure utility functions
```

## Technology stack

| Area | Technologies |
| --- | --- |
| UI | React, TypeScript, MUI |
| Client state | Redux Toolkit, React Redux |
| Server state | TanStack Query |
| Routing | React Router |
| Data grids | AG Grid, MUI X Data Grid |
| Visualisation | Recharts, D3, Apache ECharts |
| Forms | Formik, Yup |
| Internationalisation | i18next, react-i18next |
| Testing | Jest, React Testing Library, MSW |
| Quality | ESLint, Prettier, Husky, Commitlint |
| Performance | React Window, bundle analysis, code splitting |
| Observability | Sentry, PostHog, Web Vitals |
| Delivery | Docker, Nginx, GitHub Actions |

## Engineering principles

### Separate server state from client state

Remote data belongs behind the server-state boundary; global client state is reserved for application concerns that genuinely need it. Local UI state stays local where possible.

### Organise around business capabilities

Features own domain-specific behaviour. Shared layers contain genuinely reusable capabilities rather than becoming a dumping ground for unrelated code.

### Keep boundaries explicit

Pages orchestrate. Features express business workflows. Components render. Services communicate with external systems. This makes dependencies easier to reason about and test.

### Design for failure

Loading, empty, error and unexpected-render states are first-class UI states. Production systems should additionally distinguish retryable failures from user-actionable failures.

### Make quality part of delivery

Type checking, linting, formatting, tests and security checks belong in the development and delivery workflow rather than being postponed until release.

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
npm start                 # Development server
npm run build             # Production build
npm run type-check        # TypeScript validation
npm test                  # Test suite
npm run test:coverage     # Coverage report
npm run lint              # ESLint validation
npm run format:check      # Prettier validation
npm run security:audit    # Dependency audit
npm run build:analyze     # Bundle analysis
```

## Portfolio context

This is the flagship frontend-architecture project in my portfolio. It complements the broader software-engineering showcase and my data/ML portfolio by focusing specifically on **enterprise React architecture, scalable frontend systems, engineering quality and production-minded design**.

## Security

Never commit API keys, credentials, tokens, private endpoints or production secrets. Use `.env.local.example` as the public configuration contract and keep real values in local or deployment secret stores.

## License

MIT
