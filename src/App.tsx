import './App.css';

const metrics = [
  { label: 'Active services', value: '24', detail: '+3 this quarter' },
  { label: 'API health', value: '99.98%', detail: 'Last 30 days' },
  { label: 'Release frequency', value: '18', detail: 'Deployments this month' },
  { label: 'Test coverage', value: '82%', detail: 'Global target ≥ 70%' },
];

const capabilities = [
  'Feature-oriented architecture',
  'Redux Toolkit + TanStack Query',
  'Enterprise data grids and visualisation',
  'Type-safe API and service boundaries',
  'Testing, linting and commit automation',
  'Internationalisation and accessibility readiness',
];

function App() {
  return (
    <main className='platform'>
      <section className='hero'>
        <div className='eyebrow'>ENTERPRISE REACT PLATFORM</div>
        <h1>Scalable frontend architecture for enterprise applications.</h1>
        <p className='hero-copy'>
          A production-oriented React and TypeScript reference implementation focused on
          maintainability, predictable state, resilient user experiences and engineering quality.
        </p>
        <div className='hero-tags'>
          <span>React 18</span>
          <span>TypeScript</span>
          <span>Redux Toolkit</span>
          <span>TanStack Query</span>
          <span>MUI</span>
        </div>
      </section>

      <section className='metrics' aria-label='Engineering metrics'>
        {metrics.map((metric) => (
          <article className='metric' key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className='content-grid'>
        <article className='panel'>
          <div className='panel-heading'>
            <div>
              <div className='section-label'>ARCHITECTURE</div>
              <h2>Built to scale with the product and the team.</h2>
            </div>
            <span className='status'>Reference implementation</span>
          </div>
          <p>
            The codebase separates business features, shared UI, application state, server
            communication and cross-cutting concerns so individual areas can evolve without
            creating unnecessary coupling.
          </p>
          <div className='architecture-flow'>
            <span>Pages</span>
            <b>→</b>
            <span>Features</span>
            <b>→</b>
            <span>Services</span>
            <b>→</b>
            <span>APIs</span>
          </div>
        </article>

        <article className='panel'>
          <div className='section-label'>ENGINEERING CAPABILITIES</div>
          <h2>Production-minded by design.</h2>
          <ul>
            {capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </article>
      </section>

      <footer>
        <span>Vinu Joseph</span>
        <span>Enterprise frontend architecture · React · TypeScript</span>
      </footer>
    </main>
  );
}

export default App;
