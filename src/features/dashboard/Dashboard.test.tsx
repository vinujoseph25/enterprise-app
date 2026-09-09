import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';

jest.mock('../../services/platformService', () => ({
  getPlatformSnapshot: jest.fn().mockResolvedValue({
    services: [
      { id: 'identity', name: 'Identity', owner: 'Platform', status: 'healthy', uptime: 99.99, requestsPerMinute: 1840, lastDeployed: '2h ago' },
      { id: 'analytics', name: 'Analytics', owner: 'Data', status: 'degraded', uptime: 99.42, requestsPerMinute: 960, lastDeployed: '38m ago' },
    ],
    releaseCount: 18,
    testCoverage: 82,
  }),
}));

describe('Dashboard', () => {
  it('renders platform metrics and service data', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Healthy services')).toBeInTheDocument();
    expect(await screen.findByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Production-minded by design.')).toBeInTheDocument();
  });
});
