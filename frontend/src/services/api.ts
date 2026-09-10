import { WhatIfResponse, MissionMetrics } from '../types';

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE = getApiBase();

async function safeFetchJson<T = any>(
  url: string,
  init?: RequestInit,
  context: string = 'API call'
): Promise<T> {
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
    `${API_BASE}/mission/start?profile=${encodeURIComponent(profile)}`,
    { method: 'POST' },
    'Start Mission'
  );
}

export async function pauseMission() {
  return safeFetchJson(`${API_BASE}/mission/pause`, { method: 'POST' }, 'Pause Mission');
}

export async function resumeMission() {
  return safeFetchJson(`${API_BASE}/mission/resume`, { method: 'POST' }, 'Resume Mission');
}

export async function resetMission(profile: string = 'EMERGENCY_DELIVERY') {
  return safeFetchJson(
    `${API_BASE}/mission/reset?profile=${encodeURIComponent(profile)}`,
    { method: 'POST' },
    'Reset Mission'
  );
}

export async function setSimulationSpeed(speed: number) {
  return safeFetchJson(
    `${API_BASE}/mission/speed?speed=${speed}`,
    { method: 'POST' },
    'Set Simulation Speed'
  );
}

export async function injectObstacle(x?: number, y?: number) {
  const body = x !== undefined && y !== undefined ? { event_type: 'obstacle', params: { x, y } } : null;
  return safeFetchJson(
    `${API_BASE}/events/obstacle`,
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
    `${API_BASE}/events/battery-drain`,
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
    `${API_BASE}/events/sensor-degradation`,
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
    `${API_BASE}/events/communication-degradation`,
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
    `${API_BASE}/events/environment-risk`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'environment_hazard', params: { hazard } }),
    },
    'Inject Environment Hazard'
  );
}

export async function injectCombinedFault() {
  return safeFetchJson(`${API_BASE}/events/combined-fault`, { method: 'POST' }, 'Inject Combined Fault');
}

export async function recoverSystem() {
  return safeFetchJson(`${API_BASE}/events/recover`, { method: 'POST' }, 'Recover System');
}

export async function fetchMissionMetrics(missionId: string): Promise<MissionMetrics> {
  return safeFetchJson<MissionMetrics>(`${API_BASE}/metrics/${missionId}`, undefined, 'Fetch Mission Metrics');
}

export async function fetchAuditLogs(missionId: string) {
  return safeFetchJson(`${API_BASE}/audit-logs/${missionId}`, undefined, 'Fetch Audit Logs');
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
    `${API_BASE}/what-if`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Query What-If'
  );
}

export async function injectBlockAllCorridors() {
  return safeFetchJson(`${API_BASE}/events/block-all-corridors`, { method: 'POST' }, 'Block All Corridors');
}

export async function runReproducibleBenchmark(trials: number = 20, seed: number = 42) {
  return safeFetchJson(
    `${API_BASE}/benchmark/run?trials=${trials}&seed=${seed}`,
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
    `${API_BASE}/sandbox/compare-profiles`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Compare Mission Profiles'
  );
}

