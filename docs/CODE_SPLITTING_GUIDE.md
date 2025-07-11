# Code Splitting Implementation Guide

This guide provides comprehensive instructions for implementing effective code splitting strategies in our Enterprise React Application.

## 📚 Table of Contents

- [Overview](#overview)
- [Code Splitting Strategies](#code-splitting-strategies)
- [Implementation Patterns](#implementation-patterns)
- [Route-Based Splitting](#route-based-splitting)
- [Component-Based Splitting](#component-based-splitting)
- [Library Splitting](#library-splitting)
- [Dynamic Imports](#dynamic-imports)
- [Bundle Analysis](#bundle-analysis)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Code splitting is a crucial optimization technique that allows you to split your JavaScript bundle into smaller, more manageable chunks that can be loaded on demand. This leads to:

- **Faster initial page loads**
- **Better user experience**
- **Improved caching strategies**
- **Reduced bandwidth usage**
- **Better Core Web Vitals scores**

### Current Configuration

Our application uses:

- **Webpack 5** with automatic code splitting
- **React.lazy()** for component-level splitting
- **Dynamic imports** for feature-based splitting
- **Custom plugins** for optimization analysis

## 🚀 Code Splitting Strategies

### 1. Route-Based Splitting (Primary Strategy)

Split code at the route level to ensure users only download code for the pages they visit.

#### Implementation

```typescript
// src/routes/AppRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load route components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));

// Advanced lazy loading with error handling and preloading
const AdminPanel = lazy(() =>
  import('@/pages/AdminPanel').catch(error => {
    console.error('Failed to load AdminPanel:', error);
    return { default: () => <div>Failed to load Admin Panel</div> };
  })
);

export const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
```

#### Preloading Routes

```typescript
// src/utils/routePreloader.ts
export const preloadRoute = (routeImport: () => Promise<any>) => {
  // Preload on hover or focus
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routeImport.toString();
  document.head.appendChild(link);
};

// Usage in navigation components
const NavigationLink = ({ to, children, preload = false }) => {
  const handleMouseEnter = () => {
    if (preload) {
      // Preload the route component
      switch (to) {
        case '/analytics':
          import('@/pages/Analytics');
          break;
        case '/reports':
          import('@/pages/Reports');
          break;
        // Add other routes as needed
      }
    }
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
};
```

### 2. Component-Based Splitting

Split large components and their dependencies into separate chunks.

#### Heavy Components

```typescript
// src/components/DataVisualization/index.ts
import { lazy } from 'react';

// Split heavy chart components
export const AdvancedChart = lazy(() => import('./AdvancedChart'));
export const DataTable = lazy(() => import('./DataTable'));
export const GeographicMap = lazy(() => import('./GeographicMap'));

// Component with conditional loading
export const ConditionalChart = lazy(() =>
  import('./ConditionalChart').then((module) => ({
    default: module.ConditionalChart,
  }))
);
```

#### Modal and Overlay Components

```typescript
// src/components/modals/index.ts
import { lazy } from 'react';

// Split modal components as they're not immediately visible
export const UserEditModal = lazy(() => import('./UserEditModal'));
export const ConfirmationDialog = lazy(() => import('./ConfirmationDialog'));
export const ReportGeneratorModal = lazy(() => import('./ReportGeneratorModal'));

// Usage with Suspense
const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Edit User
      </button>

      {showModal && (
        <Suspense fallback={<div>Loading modal...</div>}>
          <UserEditModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />
        </Suspense>
      )}
    </>
  );
};
```

### 3. Library Splitting

Split large third-party libraries into separate chunks.

#### Chart Libraries

```typescript
// src/components/charts/ChartWrapper.tsx
import { useState, lazy, Suspense } from 'react';

// Lazy load different chart libraries based on chart type
const RechartsComponent = lazy(() => import('./RechartsChart'));
const D3Component = lazy(() => import('./D3Chart'));
const EChartsComponent = lazy(() => import('./EChartsChart'));

interface ChartWrapperProps {
  type: 'recharts' | 'd3' | 'echarts';
  data: any[];
}

export const ChartWrapper = ({ type, data }: ChartWrapperProps) => {
  const renderChart = () => {
    switch (type) {
      case 'recharts':
        return <RechartsComponent data={data} />;
      case 'd3':
        return <D3Component data={data} />;
      case 'echarts':
        return <EChartsComponent data={data} />;
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      {renderChart()}
    </Suspense>
  );
};
```

#### Date Manipulation Libraries

```typescript
// src/utils/dateUtils.ts
export const loadDateFns = () => import('date-fns');
export const loadMoment = () => import('moment');
export const loadDayjs = () => import('dayjs');

// Dynamic date utility loading
export const formatDate = async (date: Date, format: string) => {
  const { format: dateFnsFormat } = await loadDateFns();
  return dateFnsFormat(date, format);
};
```

### 4. Feature-Based Splitting

Split entire features or feature sets into separate chunks.

```typescript
// src/features/index.ts
import { lazy } from 'react';

// Split features by domain
export const UserManagementFeature = lazy(() => import('./UserManagement'));
export const AnalyticsFeature = lazy(() => import('./Analytics'));
export const ReportingFeature = lazy(() => import('./Reporting'));
export const AdminFeature = lazy(() => import('./Admin'));

// Split by user role/permission
export const loadFeatureByRole = (role: string) => {
  switch (role) {
    case 'admin':
      return import('./Admin');
    case 'manager':
      return import('./Manager');
    case 'analyst':
      return import('./Analytics');
    default:
      return import('./User');
  }
};
```

## 🔄 Dynamic Imports

### Advanced Dynamic Import Patterns

```typescript
// src/utils/dynamicLoader.ts
export class DynamicLoader {
  private static cache = new Map<string, Promise<any>>();

  // Cached dynamic import
  static async loadModule(modulePath: string) {
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath);
    }

    const modulePromise = import(modulePath);
    this.cache.set(modulePath, modulePromise);

    return modulePromise;
  }

  // Load with timeout
  static async loadWithTimeout(modulePath: string, timeout = 10000) {
    return Promise.race([
      this.loadModule(modulePath),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Module load timeout')), timeout)
      ),
    ]);
  }

  // Load with retry
  static async loadWithRetry(modulePath: string, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.loadModule(modulePath);
      } catch (error) {
        lastError = error;
        console.warn(`Retry ${i + 1}/${maxRetries} for ${modulePath}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw lastError;
  }
}
```

### Conditional Feature Loading

```typescript
// src/hooks/useFeatureLoader.ts
import { useState, useEffect } from 'react';
import { DynamicLoader } from '@/utils/dynamicLoader';

export const useFeatureLoader = (featureName: string, condition: boolean) => {
  const [feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!condition) return;

    setLoading(true);
    DynamicLoader.loadWithRetry(`@/features/${featureName}`)
      .then((module) => {
        setFeature(module.default);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        console.error(`Failed to load feature ${featureName}:`, err);
      })
      .finally(() => setLoading(false));
  }, [featureName, condition]);

  return { feature, loading, error };
};
```

## 📊 Bundle Analysis

### Using Custom Plugins

Our custom webpack plugins provide detailed analysis:

```bash
# Generate chunk analysis report
npm run build:analyze

# View reports
open reports/chunk-analysis.json
open reports/chunk-analysis-summary.txt
```

### Bundle Analyzer

```bash
# Start bundle analyzer
ANALYZE=true npm run build

# This will open http://localhost:8888 with interactive bundle analysis
```

### Performance Monitoring

```typescript
// src/utils/performanceMonitor.ts
export class PerformanceMonitor {
  static measureChunkLoadTime(chunkName: string) {
    const startTime = performance.now();

    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'chunk_load_time', {
            custom_parameter_chunk_name: chunkName,
            custom_parameter_load_time: loadTime,
          });
        }

        console.log(`Chunk ${chunkName} loaded in ${loadTime}ms`);
        return loadTime;
      },
    };
  }
}

// Usage in lazy components
const MyLazyComponent = lazy(async () => {
  const monitor = PerformanceMonitor.measureChunkLoadTime('MyLazyComponent');
  const module = await import('./MyComponent');
  monitor.end();
  return module;
});
```

## ⚡ Performance Optimization

### Preloading Strategies

```typescript
// src/utils/preloadManager.ts
export class PreloadManager {
  private static preloadedModules = new Set<string>();

  // Preload on user interaction
  static preloadOnHover(modulePath: string) {
    return {
      onMouseEnter: () => this.preload(modulePath),
      onFocus: () => this.preload(modulePath),
    };
  }

  // Preload during idle time
  static preloadOnIdle(modulePath: string) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preload(modulePath));
    } else {
      setTimeout(() => this.preload(modulePath), 100);
    }
  }

  // Preload based on user behavior
  static preloadByProbability(modulePath: string, probability: number) {
    if (Math.random() < probability) {
      this.preload(modulePath);
    }
  }

  private static preload(modulePath: string) {
    if (this.preloadedModules.has(modulePath)) return;

    this.preloadedModules.add(modulePath);
    import(modulePath).catch((error) => {
      console.warn(`Failed to preload ${modulePath}:`, error);
      this.preloadedModules.delete(modulePath);
    });
  }
}
```

### Progressive Loading

```typescript
// src/components/ProgressiveLoader.tsx
import { useState, useEffect, Suspense } from 'react';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minDisplayTime?: number;
}

export const ProgressiveLoader = ({
  children,
  fallback = <div>Loading...</div>,
  delay = 200,
  minDisplayTime = 500
}: ProgressiveLoaderProps) => {
  const [showFallback, setShowFallback] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
      setStartTime(Date.now());
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleContentLoad = () => {
    if (startTime) {
      const elapsed = Date.now() - startTime;
      if (elapsed < minDisplayTime) {
        setTimeout(() => setShowFallback(false), minDisplayTime - elapsed);
      } else {
        setShowFallback(false);
      }
    }
  };

  return (
    <Suspense
      fallback={showFallback ? fallback : null}
    >
      <div onLoad={handleContentLoad}>
        {children}
      </div>
    </Suspense>
  );
};
```

## 🎯 Best Practices

### 1. Loading States

Always provide meaningful loading states:

```typescript
// Good loading state
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner" />
    <p>Loading dashboard...</p>
  </div>
);

// Even better with skeleton screens
const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-charts">
      <div className="skeleton-chart" />
      <div className="skeleton-chart" />
    </div>
    <div className="skeleton-table" />
  </div>
);
```

### 2. Error Boundaries

Implement error boundaries for chunk loading failures:

```typescript
// src/components/ChunkErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Chunk loading error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { type: 'chunk_load_error' },
        extra: errorInfo,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="chunk-error">
          <h3>Something went wrong</h3>
          <p>Failed to load this section. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Optimization Guidelines

#### Chunk Size Guidelines

- **Initial bundle**: < 200KB (compressed)
- **Route chunks**: 50KB - 200KB
- **Component chunks**: 20KB - 100KB
- **Library chunks**: 100KB - 500KB

#### Split Points

- Split at route boundaries
- Split large third-party libraries
- Split features by user roles
- Split rarely used components

#### Naming Conventions

```typescript
// Use descriptive chunk names
const Dashboard = lazy(
  () =>
    import(
      /* webpackChunkName: "dashboard" */
      '@/pages/Dashboard'
    )
);

const AdminPanel = lazy(
  () =>
    import(
      /* webpackChunkName: "admin-panel" */
      '@/pages/AdminPanel'
    )
);
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Chunk Load Failures

```typescript
// src/utils/chunkRetry.ts
export const createRetryableImport = (
  importFn: () => Promise<any>,
  retries = 3
) => {
  return async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;

        console.warn(`Chunk load failed, retrying... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };
};

// Usage
const Dashboard = lazy(
  createRetryableImport(() => import('@/pages/Dashboard'))
);
```

#### 2. Memory Leaks

```typescript
// src/hooks/useChunkCleanup.ts
import { useEffect, useRef } from 'react';

export const useChunkCleanup = () => {
  const chunksRef = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      chunksRef.current.forEach((chunkId) => {
        const script = document.querySelector(`script[src*="${chunkId}"]`);
        if (script) {
          script.remove();
        }
      });
    };
  }, []);

  const registerChunk = (chunkId: string) => {
    chunksRef.current.add(chunkId);
  };

  return { registerChunk };
};
```

#### 3. Development vs Production Differences

```typescript
// src/utils/environmentAwareImport.ts
export const createEnvironmentAwareImport = (
  devImport: () => Promise<any>,
  prodImport: () => Promise<any>
) => {
  return process.env.NODE_ENV === 'development' ? devImport : prodImport;
};

// Usage for different loading strategies
const HeavyComponent = lazy(
  createEnvironmentAwareImport(
    // Development: Load immediately for better DX
    () => import('@/components/HeavyComponent'),
    // Production: Load with retry and error handling
    createRetryableImport(() => import('@/components/HeavyComponent'))
  )
);
```

#### 4. Bundle Size Analysis Issues

```bash
# If bundle analyzer fails to start
rm -rf node_modules/.cache
npm run build:clean
ANALYZE=true npm run build

# Check for circular dependencies
npx madge --circular --extensions ts,tsx src/

# Analyze duplicate dependencies
npx bundle-buddy analyze build/static/js/*.map
```

### Debugging Tools

```typescript
// src/utils/chunkDebugger.ts
export class ChunkDebugger {
  static logChunkLoads() {
    const originalImport = window.import;

    window.import = function (...args) {
      console.log('🔄 Loading chunk:', args[0]);
      const startTime = performance.now();

      return originalImport
        .apply(this, args)
        .then((result) => {
          const loadTime = performance.now() - startTime;
          console.log(`✅ Chunk loaded in ${loadTime.toFixed(2)}ms:`, args[0]);
          return result;
        })
        .catch((error) => {
          console.error('❌ Chunk load failed:', args[0], error);
          throw error;
        });
    };
  }

  static analyzeCurrentChunks() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const chunks = scripts
      .map((script) => ({
        src: script.src,
        size: script.textContent?.length || 0,
        loaded: script.readyState === 'complete',
      }))
      .filter((chunk) => chunk.src.includes('chunk'));

    console.table(chunks);
    return chunks;
  }
}

// Enable in development
if (process.env.NODE_ENV === 'development') {
  ChunkDebugger.logChunkLoads();
}
```

## 📈 Performance Metrics

### Key Metrics to Monitor

```typescript
// src/utils/metricsCollector.ts
export class MetricsCollector {
  static collectChunkMetrics() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('chunk')) {
          this.reportMetric('chunk_load_time', {
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  static reportMetric(name: string, data: any) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', name, data);
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${name}`, data);
    }
  }

  static measureFirstChunkLoad() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const firstChunk = list.getEntries()[0];
        if (firstChunk) {
          resolve(firstChunk.duration);
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['resource'] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }
}
```

### Performance Budgets

```typescript
// src/utils/performanceBudget.ts
export const PERFORMANCE_BUDGETS = {
  maxInitialBundleSize: 200 * 1024, // 200KB
  maxChunkSize: 250 * 1024, // 250KB
  maxAsyncChunks: 10,
  maxChunkLoadTime: 3000, // 3 seconds
  maxTotalBundleSize: 2 * 1024 * 1024, // 2MB
};

export const validatePerformanceBudget = (stats: any) => {
  const violations = [];

  // Check initial bundle size
  const mainChunk = stats.chunks.find((chunk) => chunk.names.includes('main'));
  if (mainChunk && mainChunk.size > PERFORMANCE_BUDGETS.maxInitialBundleSize) {
    violations.push({
      type: 'initial_bundle_size',
      actual: mainChunk.size,
      budget: PERFORMANCE_BUDGETS.maxInitialBundleSize,
    });
  }

  // Check individual chunk sizes
  stats.chunks.forEach((chunk) => {
    if (chunk.size > PERFORMANCE_BUDGETS.maxChunkSize) {
      violations.push({
        type: 'chunk_size',
        chunk: chunk.names[0],
        actual: chunk.size,
        budget: PERFORMANCE_BUDGETS.maxChunkSize,
      });
    }
  });

  // Check total bundle size
  const totalSize = stats.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  if (totalSize > PERFORMANCE_BUDGETS.maxTotalBundleSize) {
    violations.push({
      type: 'total_bundle_size',
      actual: totalSize,
      budget: PERFORMANCE_BUDGETS.maxTotalBundleSize,
    });
  }

  return violations;
};
```

## 🔧 Advanced Techniques

### 1. Intelligent Preloading

```typescript
// src/utils/intelligentPreloader.ts
export class IntelligentPreloader {
  private static userPatterns = new Map<string, number>();
  private static connectionSpeed = 'unknown';

  static init() {
    // Detect connection speed
    if ('connection' in navigator) {
      this.connectionSpeed = (navigator as any).connection.effectiveType;
    }

    // Load user patterns from localStorage
    const savedPatterns = localStorage.getItem('userPatterns');
    if (savedPatterns) {
      this.userPatterns = new Map(JSON.parse(savedPatterns));
    }
  }

  static trackNavigation(from: string, to: string) {
    const key = `${from}->${to}`;
    const current = this.userPatterns.get(key) || 0;
    this.userPatterns.set(key, current + 1);

    // Save to localStorage
    localStorage.setItem(
      'userPatterns',
      JSON.stringify(Array.from(this.userPatterns.entries()))
    );
  }

  static shouldPreload(currentRoute: string, targetRoute: string): boolean {
    const key = `${currentRoute}->${targetRoute}`;
    const probability = this.userPatterns.get(key) || 0;

    // Don't preload on slow connections
    if (this.connectionSpeed === '2g' || this.connectionSpeed === 'slow-2g') {
      return false;
    }

    // Preload if user has navigated this path more than 3 times
    return probability > 3;
  }

  static preloadRoute(routePath: string) {
    if (!this.shouldPreload(window.location.pathname, routePath)) {
      return;
    }

    // Dynamic import based on route
    switch (routePath) {
      case '/dashboard':
        import('@/pages/Dashboard');
        break;
      case '/analytics':
        import('@/pages/Analytics');
        break;
      case '/reports':
        import('@/pages/Reports');
        break;
      // Add more routes as needed
    }
  }
}
```

### 2. Service Worker Chunk Caching

```typescript
// src/sw/chunkCaching.ts
const CHUNK_CACHE_NAME = 'chunks-v1';

self.addEventListener('fetch', (event) => {
  // Cache chunk files
  if (event.request.url.includes('chunk')) {
    event.respondWith(
      caches.open(CHUNK_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Serve from cache
            return response;
          }

          // Fetch and cache
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
  }
});

// Clean up old chunks
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAN_CHUNK_CACHE') {
    caches.open(CHUNK_CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        const oldChunks = keys.filter(
          (key) => !event.data.currentChunks.includes(key.url)
        );

        oldChunks.forEach((key) => cache.delete(key));
      });
    });
  }
});
```

### 3. A/B Testing for Chunk Strategies

```typescript
// src/utils/chunkABTesting.ts
export class ChunkABTesting {
  private static variant: 'control' | 'test' = 'control';

  static init() {
    // Determine variant (50/50 split)
    this.variant = Math.random() < 0.5 ? 'control' : 'test';

    // Store in session
    sessionStorage.setItem('chunkVariant', this.variant);
  }

  static getLoadingStrategy() {
    const variant = sessionStorage.getItem('chunkVariant') || this.variant;

    if (variant === 'test') {
      return {
        preloadAggressively: true,
        useSmallChunks: true,
        prefetchOnHover: true,
      };
    }

    return {
      preloadAggressively: false,
      useSmallChunks: false,
      prefetchOnHover: false,
    };
  }

  static reportMetrics(metric: string, value: number) {
    const variant = sessionStorage.getItem('chunkVariant');

    // Send to analytics with variant
    if (window.gtag) {
      window.gtag('event', metric, {
        custom_parameter_variant: variant,
        value: value,
      });
    }
  }
}
```

## 📋 Checklist

### Pre-Implementation

- [ ] Analyze current bundle size and composition
- [ ] Identify split points (routes, features, libraries)
- [ ] Set performance budgets
- [ ] Plan loading and error states

### Implementation

- [ ] Implement route-based splitting
- [ ] Add component-based splitting for heavy components
- [ ] Split large third-party libraries
- [ ] Add proper error boundaries
- [ ] Implement loading states and skeleton screens
- [ ] Add preloading strategies

### Testing

- [ ] Test on slow connections (throttle to 2G)
- [ ] Verify error handling for failed chunk loads
- [ ] Check loading states and user experience
- [ ] Validate performance metrics
- [ ] Test across different browsers and devices

### Monitoring

- [ ] Set up performance monitoring
- [ ] Track chunk load times
- [ ] Monitor error rates
- [ ] Analyze user navigation patterns
- [ ] Regular bundle analysis

### Optimization

- [ ] Regular performance audits
- [ ] Adjust chunk sizes based on usage patterns
- [ ] Update preloading strategies
- [ ] Optimize based on real user metrics

## 📚 Additional Resources

### Webpack Configuration

- [SplitChunksPlugin Documentation](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)

### React Patterns

- [React.lazy() Documentation](https://reactjs.org/docs/code-splitting.html)
- [Suspense for Data Fetching](https://reactjs.org/docs/concurrent-mode-suspense.html)

### Performance Tools

- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Source Map Explorer](https://github.com/danvk/source-map-explorer)
- [Bundle Buddy](https://github.com/samccone/bundle-buddy)

### Best Practices

- [Web.dev Code Splitting](https://web.dev/code-splitting-suspense/)
- [Loading Performance Best Practices](https://web.dev/fast/)

---

This guide should be regularly updated as new patterns emerge and performance requirements change. Remember that the best code splitting strategy depends on your specific application's usage patterns and user behavior.
