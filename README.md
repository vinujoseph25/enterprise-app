# Enterprise React Platform

> A production-minded React + TypeScript reference architecture for scalable enterprise web applications.

The **Enterprise React Platform** is the flagship frontend architecture project in my portfolio. It demonstrates how I structure a large React application so that features, state, service integrations, testing and cross-cutting concerns remain understandable as the system and engineering team grow.

## Why this project exists

Enterprise frontends become difficult to maintain when business features, UI concerns, API calls and global state become tightly coupled. This project explores a more deliberate approach built around explicit boundaries, typed contracts and production-oriented engineering practices.

## Architecture

```text
Routes / Pages
      ↓
Feature modules
      ↓
UI + domain orchestration
      ↓
┌───────────────────┬───────────────────┐
│ Client state      │ Server state       │
│ Redux Toolkit     │ TanStack Query     │
└───────────────────┴───────────────────┘
      ↓
Service / API boundary
      ↓
External systems
```

The implementation separates **business features, presentation, client state, server state, service integration and cross-cutting concerns**. The goal is to demonstrate architectural judgement rather than provide another generic React starter.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for deeper architectural decisions and trade-offs.

## Engineering capabilities demonstrated

- Feature-oriented React architecture
- Strict TypeScript and explicit domain models
- Redux Toolkit for application/client state
- TanStack Query for server state and request lifecycle
- Reusable components, hooks, services and utilities
- Enterprise dashboard and data-grid patterns
- Loading, empty, error and defensive UI states
- Internationalisation-ready structure
- Unit and component testing
- Mockable service boundaries
- Linting, formatting and commit-quality automation
- Docker and CI/CD-oriented delivery
- Performance-conscious patterns such as code splitting and virtualisation
- Security-conscious environment configuration

## Technology stack

| Area | Technologies |
| --- | --- |
| UI | React, TypeScript, MUI |
| State | Redux Toolkit, React Redux |
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

## Project structure

```text
src/
├── assets/          # Application assets
├── components/      # Shared presentation components
├── config/          # Runtime/application configuration
├── context/         # Cross-cutting providers
├── errorBoundary/   # Resilience and error handling
├── features/        # Business capabilities
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

## Architectural principles

### 1. Separate server state from client state

Remote data belongs behind the server-state boundary. Global client state is reserved for application concerns that genuinely need it, while local UI state remains local where practical.

### 2. Organise around business capabilities

Feature modules own domain-specific behaviour. Shared layers contain capabilities that are genuinely reusable rather than becoming a dumping ground for unrelated code.

### 3. Keep boundaries explicit

Pages orchestrate. Features express workflows. Components render. Services communicate with external systems. Explicit boundaries make dependencies easier to reason about and test.

### 4. Design for failure

Loading, empty, error and unexpected-render states are treated as part of the feature rather than as afterthoughts.

### 5. Make quality part of delivery

Type checking, linting, formatting and tests belong in the development workflow and should be automated wherever possible.

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

## Portfolio role

This is the **flagship frontend architecture case study** in my portfolio. It complements the broader Software Engineering Portfolio and the Data Analysis Portfolio by focusing specifically on scalable React systems, architecture, engineering quality and production-minded design.

## Security

Never commit API keys, credentials, tokens or production secrets. Use `.env.local.example` as the public configuration contract and keep real values in local or deployment secret stores.

## License

MIT
