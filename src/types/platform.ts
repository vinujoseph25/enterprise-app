export type ServiceStatus = 'healthy' | 'degraded' | 'offline';

export interface PlatformService {
  id: string;
  name: string;
  owner: string;
  status: ServiceStatus;
  uptime: number;
  requestsPerMinute: number;
  lastDeployed: string;
}

export interface PlatformSnapshot {
  services: PlatformService[];
  releaseCount: number;
  testCoverage: number;
}
