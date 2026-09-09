import { useEffect, useState } from 'react';
import { getPlatformSnapshot } from '../../services/platformService';
import type { PlatformSnapshot } from '../../types/platform';

const capabilities = [
  'Feature-oriented architecture',
  'Predictable client state and server-state boundaries',
  'Reusable enterprise UI and data visualisation patterns',
  'Type-safe service contracts',
  'Testing, linting and commit automation',
  'Accessibility and internationalisation readiness',
];

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<PlatformSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPlatformSnapshot()
      .then((data) => active && setSnapshot(data))
      .catch(() => active && setError('Unable to load platform data.'));
    return () => {
      active = false;
    };
  }, []);

  const healthyServices = snapshot?.services.filter((service) => service.status === 'healthy').length ?? 0;
  const apiHealth = snapshot
    ? (snapshot.services.reduce((sum, service) => sum + service.uptime, 0) / snapshot.services.length).toFixed(2)
    : '—';

  return (
    <main className='platform'>
      <section className='hero'>
        <div className='eyebrow'>ENTERPRISE REACT PLATFORM</div>
        <h1>Scalable frontend architecture for enterprise applications.</h1>
        <p className='hero-copy'>
          A production-oriented React and TypeScript reference implementation demonstrating clear
          domain boundaries, resilient data flows and maintainable engineering practices.
        </p>
        <div className='hero-tags'><span>React 18</span><span>TypeScript</span><span>Redux Toolkit</span><span>TanStack Query</span><span>MUI</span></div>
      </section>

      {error && <div className='error-banner' role='alert'>{error}</div>}

      <section className='metrics' aria-label='Platform metrics'>
        <article className='metric'><p>Healthy services</p><strong>{snapshot ? `${healthyServices}/${snapshot.services.length}` : '—'}</strong><span>Current platform state</span></article>
        <article className='metric'><p>API health</p><strong>{snapshot ? `${apiHealth}%` : '—'}</strong><span>Average service uptime</span></article>
        <article className='metric'><p>Release frequency</p><strong>{snapshot?.releaseCount ?? '—'}</strong><span>Deployments this month</span></article>
        <article className='metric'><p>Test coverage</p><strong>{snapshot ? `${snapshot.testCoverage}%` : '—'}</strong><span>Engineering quality target</span></article>
      </section>

      <section className='content-grid'>
        <article className='panel'>
          <div className='panel-heading'><div><div className='section-label'>SERVICE CATALOG</div><h2>Operational visibility without coupling the UI to infrastructure.</h2></div><span className='status'>Mock API boundary</span></div>
          <div className='service-list'>
            {snapshot?.services.map((service) => <div className='service-row' key={service.id}><div><strong>{service.name}</strong><span>{service.owner} · {service.requestsPerMinute.toLocaleString()} req/min</span></div><div className={`service-status ${service.status}`}><span />{service.status}<small>{service.uptime}% uptime</small></div></div>) ?? <p>Loading platform data…</p>}
          </div>
        </article>

        <article className='panel'>
          <div className='section-label'>ENGINEERING CAPABILITIES</div>
          <h2>Production-minded by design.</h2>
          <ul>{capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
        </article>
      </section>

      <section className='architecture panel'>
        <div className='section-label'>ARCHITECTURE</div>
        <h2>Explicit boundaries make change safer.</h2>
        <p>Pages and feature modules consume domain services and typed contracts. Shared UI stays reusable while data access remains isolated behind service boundaries.</p>
        <div className='architecture-flow'><span>UI</span><b>→</b><span>Features</span><b>→</b><span>Services</span><b>→</b><span>Typed domain models</span></div>
      </section>

      <footer><span>Vinu Joseph</span><span>Enterprise frontend architecture · React · TypeScript</span></footer>
    </main>
  );
}
