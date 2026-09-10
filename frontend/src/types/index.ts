export type ActionType =
  | 'CONTINUE'
  | 'SLOW_DOWN'
  | 'REPLAN'
  | 'DEGRADED_AUTONOMY'
  | 'RETURN_TO_SAFE_ZONE'
  | 'EMERGENCY_STOP';

export type ModeType =
  | 'NORMAL'
  | 'DEGRADED_AUTONOMY'
  | 'SAFE_RETURN'
  | 'EMERGENCY_STOP';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface Telemetry {
  robot_id: string;
  x: number;
  y: number;
  battery: number;
  sensor_health: number;
  communication_latency: number;
  communication_reliability: number;
  speed: number;
  obstacle_distance: number;
  obstacle_density: number;
  environment_risk: number;
  mission_priority: number;
  mission_progress: number;
  energy_consumption_rate: number;
  current_mode: ModeType;
  timestamp: number;
}

export interface RiskBreakdown {
  battery_risk: number;
  sensor_risk: number;
  communication_risk: number;
  obstacle_risk: number;
  environment_risk: number;
  mission_criticality: number;
  composite_risk: number;
  risk_level: RiskLevel;
  anomaly_score: number;
  is_anomaly: boolean;
}

export interface Explanation {
  primary_drivers: string[];
  rationale: string;
  recommended_action: string;
  tradeoff_summary?: string;
}

export interface Route {
  id: string;
  name: string;
  points: [number, number][];
  length: number;
  risk_cost: number;
  energy_cost: number;
  total_score: number;
  is_blocked: boolean;
}

export interface MissionDecision {
  action: ActionType;
  mode: ModeType;
  reason: string;
  selected_route_id?: string;
  explanation: Explanation;
  timestamp: number;
}

export interface MissionMetrics {
  mission_id: string;
  status: string;
  duration_seconds: number;
  distance_traveled: number;
  energy_consumed: number;
  replanning_count: number;
  near_miss_count: number;
  collision_count: number;
  avg_risk_score: number;
  peak_risk_score: number;
  degraded_autonomy_seconds: number;
  baseline_comparison?: {
    baseline: {
      name: string;
      success: boolean;
      distance: number;
      energy_consumed: number;
      avg_risk: number;
      collisions: number;
      near_misses: number;
      time_seconds: number;
    };
    mira: {
      name: string;
      success: boolean;
      distance: number;
      energy_consumed: number;
      avg_risk: number;
      collisions: number;
      near_misses: number;
      time_seconds: number;
    };
    risk_reduction_pct: number;
    safety_margin_improvement_pct: number;
  };
}

export interface SimulationState {
  mission_id: string;
  mission_type: string;
  mission_name: string;
  robot_id: string;
  x: number;
  y: number;
  telemetry: Telemetry;
  risk: RiskBreakdown;
  decision: MissionDecision;
  current_route: [number, number][];
  candidate_routes: Route[];
  dynamic_obstacles: [number, number][];
  static_obstacles: [number, number][];
  depot: [number, number];
  medical_camp: [number, number];
  safe_zone: [number, number];
  is_running: boolean;
  is_paused: boolean;
  sim_speed: number;
  step_count: number;
  metrics: MissionMetrics;
}

export interface WhatIfResponse {
  composite_risk: number;
  risk_level: string;
  breakdown: RiskBreakdown;
  recommended_action: string;
  operating_mode: string;
  explanation: string;
  tradeoff_advice: string;
}

export interface AuditLogEntry {
  id: number;
  mission_id: string;
  step: number;
  action: string;
  mode: string;
  reason: string;
  tradeoff_details?: string;
  timestamp: number;
}
