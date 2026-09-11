import { WhatIfResponse, MissionMetrics, BenchmarkResponse } from '../types';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mira_backend_url');
    if (stored && stored.trim()) {
      return stored.trim().replace(/\/$/, '');
    }
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      const protocol = window.location.protocol || 'http:';
      return `${protocol}//${hostname}:8000`;
    }
  }
  return 'https://mira-backend.onrender.com';
};

export const setApiBase = (url: string) => {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('mira_backend_url');
    } else {
      localStorage.setItem('mira_backend_url', url.trim().replace(/\/$/, ''));
    }
    window.dispatchEvent(new CustomEvent('mira_backend_url_changed', { detail: url }));
  }
};

export async function testBackendHealth(customUrl?: string): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const target = (customUrl || getApiBase()).replace(/\/$/, '');
  const start = performance.now();
  try {
    const res = await fetch(`${target}/health`, { method: 'GET', signal: AbortSignal.timeout(10000) });
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: `Connected (${latencyMs}ms) - ${data.service || 'MIRA Online'}`, latencyMs };
    }
    return { ok: false, message: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network timeout / unreachable' };
  }
}

async function safeFetchJson<T = any>(
  pathOrUrl: string,
  init?: RequestInit,
  context: string = 'API call'
): Promise<T> {
  const base = getApiBase();
  const url = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')
    ? pathOrUrl
    : `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson?.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      } else if (errorJson?.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // body is not json
    }
    throw new Error(`${context} failed: ${errorDetail}`);
  }
  return res.json();
}

export async function startMission(profile: string = 'EMERGENCY_DELIVERY') {
  return safeFetchJson(
    `${getApiBase()}/mission/start?profile=${encodeURIComponent(profile)}`,
    { method: 'POST' },
    'Start Mission'
  );
}

export async function pauseMission() {
  return safeFetchJson(`${getApiBase()}/mission/pause`, { method: 'POST' }, 'Pause Mission');
}

export async function resumeMission() {
  return safeFetchJson(`${getApiBase()}/mission/resume`, { method: 'POST' }, 'Resume Mission');
}

export async function resetMission(profile: string = 'EMERGENCY_DELIVERY') {
  return safeFetchJson(
    `${getApiBase()}/mission/reset?profile=${encodeURIComponent(profile)}`,
    { method: 'POST' },
    'Reset Mission'
  );
}

export async function setSimulationSpeed(speed: number) {
  return safeFetchJson(
    `${getApiBase()}/mission/speed?speed=${speed}`,
    { method: 'POST' },
    'Set Simulation Speed'
  );
}

export async function injectObstacle(x?: number, y?: number) {
  const body = x !== undefined && y !== undefined ? { event_type: 'obstacle', params: { x, y } } : null;
  return safeFetchJson(
    `${getApiBase()}/events/obstacle`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    },
    'Inject Obstacle'
  );
}

export async function injectBatteryDrain(battery: number = 48.0) {
  return safeFetchJson(
    `${getApiBase()}/events/battery-drain`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'battery_drain', params: { battery } }),
    },
    'Inject Battery Drain'
  );
}

export async function injectSensorDegradation(sensorHealth: number = 48.0) {
  return safeFetchJson(
    `${getApiBase()}/events/sensor-degradation`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'sensor_degradation', params: { sensor_health: sensorHealth } }),
    },
    'Inject Sensor Degradation'
  );
}

export async function injectCommDegradation(latency: number = 480.0, reliability: number = 68.0) {
  return safeFetchJson(
    `${getApiBase()}/events/communication-degradation`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'comm_degradation', params: { latency, reliability } }),
    },
    'Inject Communication Degradation'
  );
}

export async function injectEnvironmentHazard(hazard: number = 85.0) {
  return safeFetchJson(
    `${getApiBase()}/events/environment-risk`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'environment_hazard', params: { hazard } }),
    },
    'Inject Environment Hazard'
  );
}

export async function injectCombinedFault() {
  return safeFetchJson(`${getApiBase()}/events/combined-fault`, { method: 'POST' }, 'Inject Combined Fault');
}

export async function recoverSystem() {
  return safeFetchJson(`${getApiBase()}/events/recover`, { method: 'POST' }, 'Recover System');
}

export async function fetchMissionMetrics(missionId: string): Promise<MissionMetrics> {
  return safeFetchJson<MissionMetrics>(`${getApiBase()}/metrics/${missionId}`, undefined, 'Fetch Mission Metrics');
}

export async function fetchAuditLogs(missionId: string) {
  return safeFetchJson(`${getApiBase()}/audit-logs/${missionId}`, undefined, 'Fetch Audit Logs');
}

export async function queryWhatIf(params: {
  battery: number;
  sensor_health: number;
  communication_latency: number;
  obstacle_density: number;
  environment_risk: number;
  mission_profile: string;
}): Promise<WhatIfResponse> {
  return safeFetchJson<WhatIfResponse>(
    `${getApiBase()}/what-if`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Query What-If'
  );
}

export async function injectBlockAllCorridors() {
  return safeFetchJson(`${getApiBase()}/events/block-all-corridors`, { method: 'POST' }, 'Block All Corridors');
}

export async function runReproducibleBenchmark(trials: number = 20, seed: number = 42): Promise<BenchmarkResponse> {
  return safeFetchJson<BenchmarkResponse>(
    `${getApiBase()}/benchmark/run?trials=${trials}&seed=${seed}`,
    { method: 'POST' },
    'Run Benchmark'
  );
}

export async function compareMissionProfiles(params: {
  battery: number;
  sensor_health: number;
  communication_latency: number;
  obstacle_density: number;
  environment_risk: number;
  mission_profile: string;
}) {
  return safeFetchJson(
    `${getApiBase()}/sandbox/compare-profiles`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Compare Mission Profiles'
  );
}

