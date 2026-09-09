# Enterprise React Platform

A production-oriented React + TypeScript reference architecture for building scalable enterprise web applications.

This project focuses on the engineering concerns that become important as a frontend grows beyond a single-page prototype: feature boundaries, predictable state management, server-state caching, reusable UI, data-heavy screens, internationalisation, observability, testing, security hygiene, and deployment readiness.

> **Portfolio note:** This repository is intentionally an architecture-focused reference implementation. The goal is to demonstrate how I approach frontend architecture and engineering quality rather than present a generic starter template.

## What this demonstrates

- **Feature-oriented architecture** for keeping business capabilities isolated and maintainable
- **Type-safe React development** with TypeScript
- **Redux Toolkit + TanStack Query** for client and server state separation
- **Enterprise UI patterns** with MUI and AG Grid
- **Data visualisation** with Recharts, D3 and ECharts where appropriate
- **Reusable hooks, services and utilities** to reduce coupling
- **Error boundaries and defensive UI patterns** for resilient experiences
- **Internationalisation-ready structure** using i18next
- **Testing and mocking** with Jest, React Testing Library and MSW
- **Code quality automation** with ESLint, Prettier, Husky and commit conventions
- **Container and deployment support** with Docker and CI/CD configuration
- **Performance-minded patterns** including code splitting, virtualisation and bundle analysis

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

The architecture deliberately separates **UI, business features, application state, server communication and cross-cutting concerns**. This makes it easier to scale teams and functionality without turning the codebase into a tightly coupled component collection.

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

### 1. Separate server state from client state

API data belongs to TanStack Query, while local application state and UI state can be managed with Redux Toolkit or component state. This avoids using a single state mechanism for unrelated concerns.

### 2. Organise around features

Business capabilities should own their components, hooks, services, types and state where practical. Shared code belongs in shared layers rather than being duplicated across features.

### 3. Keep components composable

Presentation components should remain reusable and focused. Domain-specific orchestration belongs closer to feature and page boundaries.

### 4. Treat quality as part of development

Linting, formatting, type checking, automated tests and pre-commit validation are part of the development workflow rather than after-the-fact cleanup.

### 5. Design for production concerns early

The project includes patterns for error handling, observability, accessibility, performance analysis, environment configuration and containerised delivery so those concerns do not become late-stage rewrites.

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

The application starts on the default Create React App development port.

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

## Environment configuration

Environment-specific values should remain outside version control. Use `.env.local.example` as the public template and create a local `.env.local` for machine-specific settings.

Never commit API keys, credentials, tokens, private endpoints or production secrets.

## Delivery

The repository contains Docker and CI/CD configuration intended to demonstrate production delivery practices. Deployment configuration should be adapted to the target hosting environment rather than treated as a one-size-fits-all platform.

## Portfolio focus

This repository is part of my engineering portfolio and complements projects demonstrating data science, analytics and application engineering. It is intended to show practical experience with **enterprise frontend architecture, scalable React applications, engineering quality and production-minded development**.

## License

MIT
