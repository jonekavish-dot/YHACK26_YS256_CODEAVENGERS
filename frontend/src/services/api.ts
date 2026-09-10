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

export async function startMission(profile: string = 'EMERGENCY_DELIVERY') {
  const res = await fetch(`${API_BASE}/mission/start?profile=${encodeURIComponent(profile)}`, {
    method: 'POST',
  });
  return res.json();
}

export async function pauseMission() {
  const res = await fetch(`${API_BASE}/mission/pause`, { method: 'POST' });
  return res.json();
}

export async function resumeMission() {
  const res = await fetch(`${API_BASE}/mission/resume`, { method: 'POST' });
  return res.json();
}

export async function resetMission(profile: string = 'EMERGENCY_DELIVERY') {
  const res = await fetch(`${API_BASE}/mission/reset?profile=${encodeURIComponent(profile)}`, {
    method: 'POST',
  });
  return res.json();
}

export async function setSimulationSpeed(speed: number) {
  const res = await fetch(`${API_BASE}/mission/speed?speed=${speed}`, { method: 'POST' });
  return res.json();
}

export async function injectObstacle(x?: number, y?: number) {
  const body = x !== undefined && y !== undefined ? { event_type: 'obstacle', params: { x, y } } : null;
  const res = await fetch(`${API_BASE}/events/obstacle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function injectBatteryDrain(battery: number = 48.0) {
  const res = await fetch(`${API_BASE}/events/battery-drain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'battery_drain', params: { battery } }),
  });
  return res.json();
}

export async function injectSensorDegradation(sensorHealth: number = 48.0) {
  const res = await fetch(`${API_BASE}/events/sensor-degradation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'sensor_degradation', params: { sensor_health: sensorHealth } }),
  });
  return res.json();
}

export async function injectCommDegradation(latency: number = 480.0, reliability: number = 68.0) {
  const res = await fetch(`${API_BASE}/events/communication-degradation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'comm_degradation', params: { latency, reliability } }),
  });
  return res.json();
}

export async function injectEnvironmentHazard(hazard: number = 85.0) {
  const res = await fetch(`${API_BASE}/events/environment-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'environment_hazard', params: { hazard } }),
  });
  return res.json();
}

export async function injectCombinedFault() {
  const res = await fetch(`${API_BASE}/events/combined-fault`, { method: 'POST' });
  return res.json();
}

export async function recoverSystem() {
  const res = await fetch(`${API_BASE}/events/recover`, { method: 'POST' });
  return res.json();
}

export async function fetchMissionMetrics(missionId: string): Promise<MissionMetrics> {
  const res = await fetch(`${API_BASE}/metrics/${missionId}`);
  return res.json();
}

export async function fetchAuditLogs(missionId: string) {
  const res = await fetch(`${API_BASE}/audit-logs/${missionId}`);
  return res.json();
}

export async function queryWhatIf(params: {
  battery: number;
  sensor_health: number;
  communication_latency: number;
  obstacle_density: number;
  environment_risk: number;
  mission_profile: string;
}): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function injectBlockAllCorridors() {
  const res = await fetch(`${API_BASE}/events/block-all-corridors`, { method: 'POST' });
  return res.json();
}

export async function runReproducibleBenchmark(trials: number = 20, seed: number = 42) {
  const res = await fetch(`${API_BASE}/benchmark/run?trials=${trials}&seed=${seed}`, { method: 'POST' });
  return res.json();
}

export async function compareMissionProfiles(params: {
  battery: number;
  sensor_health: number;
  communication_latency: number;
  obstacle_density: number;
  environment_risk: number;
  mission_profile: string;
}) {
  const res = await fetch(`${API_BASE}/sandbox/compare-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

