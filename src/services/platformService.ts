import type { PlatformSnapshot } from '../types/platform';

const snapshot: PlatformSnapshot = {
  services: [
    { id: 'identity', name: 'Identity', owner: 'Platform', status: 'healthy', uptime: 99.99, requestsPerMinute: 1840, lastDeployed: '2h ago' },
    { id: 'orders', name: 'Orders', owner: 'Commerce', status: 'healthy', uptime: 99.97, requestsPerMinute: 3210, lastDeployed: '5h ago' },
    { id: 'analytics', name: 'Analytics', owner: 'Data', status: 'degraded', uptime: 99.42, requestsPerMinute: 960, lastDeployed: '38m ago' },
    { id: 'notifications', name: 'Notifications', owner: 'Engagement', status: 'healthy', uptime: 99.95, requestsPerMinute: 1270, lastDeployed: '1d ago' },
  ],
  releaseCount: 18,
  testCoverage: 82,
};

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  return snapshot;
}
