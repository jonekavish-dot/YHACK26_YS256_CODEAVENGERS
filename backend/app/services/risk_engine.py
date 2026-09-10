"""
MIRA Deterministic & Hybrid Risk Engine
Calculates normalized multi-factor risk scores (0-100) and integrates AI anomaly flags.
"""
import math
from typing import Dict, Any, Tuple, Optional, List
from ..config import (
    RiskWeights,
    RiskThresholds,
    DEFAULT_WEIGHTS,
    DEFAULT_THRESHOLDS,
    SAFE_ZONE_POS,
    SAFE_RETURN_COST_PER_CELL,
    MISSION_PROFILES,
)
from ..schemas.types import RiskBreakdown, RiskLevelEnum
from .anomaly_engine import anomaly_engine


class RiskEngine:
    def __init__(
        self,
        weights: RiskWeights = DEFAULT_WEIGHTS,
        thresholds: RiskThresholds = DEFAULT_THRESHOLDS,
    ):
        self.weights = weights
        self.thresholds = thresholds

    def compute_battery_risk(
        self,
        battery: float,
        consumption_rate: float,
        current_pos: Tuple[int, int],
        safe_zone_pos: Tuple[int, int] = SAFE_ZONE_POS,
    ) -> float:
        """
        Evaluates battery risk considering margin required for safe return.
        """
        dist_to_safe = math.hypot(current_pos[0] - safe_zone_pos[0], current_pos[1] - safe_zone_pos[1])
        min_reserve_needed = dist_to_safe * SAFE_RETURN_COST_PER_CELL + 10.0  # 10% safety margin

        # Critical battery margin breach
        if battery <= min_reserve_needed:
            shortfall = min_reserve_needed - battery
            return min(100.0, 75.0 + shortfall * 2.5)

        # Baseline battery depletion curve
        drain_risk = max(0.0, (100.0 - battery) * 0.85)

        # Consumption rate penalty (nominal is 1.0 - 1.2 W/m)
        consumption_penalty = max(0.0, (consumption_rate - 1.2) * 25.0)

        total_battery_risk = drain_risk + consumption_penalty
        return round(min(100.0, max(0.0, total_battery_risk)), 1)

    def compute_sensor_risk(self, sensor_health: float) -> float:
        """
        Evaluates sensor risk. Degraded sensors severely impact obstacle perception.
        """
        health = max(0.0, min(100.0, sensor_health))
        if health >= 90.0:
            return round((100.0 - health) * 1.0, 1)
        elif health >= 60.0:
            # Moderate degradation
            return round(10.0 + (90.0 - health) * 1.5, 1)
        else:
            # Severe degradation (scaled cleanly to max 100.0 at health=0)
            return round(min(100.0, max(0.0, 55.0 + (60.0 - health) * 0.75)), 1)

    def compute_communication_risk(self, latency_ms: float, reliability_pct: float) -> float:
        """
        Evaluates communication risk based on round-trip latency and packet reliability.
        """
        # Latency curve: 0-80ms is normal; >300ms is high; >600ms is severe
        latency_score = min(100.0, (latency_ms / 500.0) * 100.0)

        # Reliability curve: 100% is 0 risk, <85% is high
        reliability_score = max(0.0, min(100.0, (100.0 - reliability_pct) * 2.5))

        comm_risk = 0.55 * latency_score + 0.45 * reliability_score
        return round(min(100.0, max(0.0, comm_risk)), 1)

    def compute_obstacle_risk(
        self,
        obstacle_dist_m: float,
        obstacle_density: float,
        route_blocked: bool = False,
    ) -> float:
        """
        Evaluates immediate obstacle danger, local spatial clutter, and route blockage.
        """
        # Distance component
        if obstacle_dist_m <= 1.0:
            dist_score = 95.0
        elif obstacle_dist_m <= 2.5:
            dist_score = 75.0 - (obstacle_dist_m - 1.0) * 20.0
        elif obstacle_dist_m <= 5.0:
            dist_score = 45.0 - (obstacle_dist_m - 2.5) * 12.0
        else:
            dist_score = max(0.0, 15.0 - (obstacle_dist_m - 5.0) * 2.0)

        density_score = min(100.0, obstacle_density * 100.0)
        base_obstacle_risk = 0.65 * dist_score + 0.35 * density_score

        if route_blocked:
            base_obstacle_risk = min(100.0, base_obstacle_risk + 35.0)

        return round(min(100.0, max(0.0, base_obstacle_risk)), 1)

    def compute_environment_risk(self, environment_hazard: float) -> float:
        """
        Direct environmental hazard level (0-100).
        """
        return round(min(100.0, max(0.0, environment_hazard)), 1)

    def compute_step_physical_risk(
        self,
        battery: float,
        pos: Tuple[int, int],
        sensor_health: float,
        comm_latency: float,
        comm_reliability: float,
        obstacle_risk: float,
        environment_hazard: float,
        consumption_rate: float = 1.0,
    ) -> float:
        """
        Shared authoritative physical operating hazard calculation (0-100).
        Evaluates physical hazard components: battery, sensor, comms, obstacle, and environment.
        Used across live simulation and benchmark trials to ensure identical physical semantics.
        """
        b_risk = self.compute_battery_risk(battery, consumption_rate, pos)
        s_risk = self.compute_sensor_risk(sensor_health)
        c_risk = self.compute_communication_risk(comm_latency, comm_reliability)
        e_risk = self.compute_environment_risk(environment_hazard)
        o_risk = min(100.0, max(0.0, obstacle_risk))

        w = self.weights
        physical = (
            w.battery * b_risk
            + w.sensor * s_risk
            + w.communication * c_risk
            + w.obstacle * o_risk
            + w.environment * e_risk
        )
        return round(min(100.0, max(0.0, physical)), 1)

    def get_risk_level(self, score: float) -> RiskLevelEnum:
        if score <= self.thresholds.normal_max:
            return RiskLevelEnum.GREEN
        elif score <= self.thresholds.caution_max:
            return RiskLevelEnum.YELLOW
        elif score <= self.thresholds.high_max:
            return RiskLevelEnum.ORANGE
        else:
            return RiskLevelEnum.RED

    def evaluate(
        self,
        telemetry: Dict[str, Any],
        mission_profile_key: str = "EMERGENCY_DELIVERY",
        route_blocked: bool = False,
        prev_battery: float = 85.0,
        risk_history: Optional[List[float]] = None,
    ) -> RiskBreakdown:
        """
        Computes full multi-factor risk breakdown and composite mission risk.
        """
        profile = MISSION_PROFILES.get(
            mission_profile_key, MISSION_PROFILES["EMERGENCY_DELIVERY"]
        )
        pos = (int(telemetry.get("x", 2)), int(telemetry.get("y", 2)))

        b_risk = self.compute_battery_risk(
            battery=float(telemetry.get("battery", 85.0)),
            consumption_rate=float(telemetry.get("energy_consumption_rate", 1.2)),
            current_pos=pos,
        )

        s_risk = self.compute_sensor_risk(
            sensor_health=float(telemetry.get("sensor_health", 96.0))
        )

        c_risk = self.compute_communication_risk(
            latency_ms=float(telemetry.get("communication_latency", 45.0)),
            reliability_pct=float(telemetry.get("communication_reliability", 98.0)),
        )

        o_risk = self.compute_obstacle_risk(
            obstacle_dist_m=float(telemetry.get("obstacle_distance", 8.0)),
            obstacle_density=float(telemetry.get("obstacle_density", 0.1)),
            route_blocked=route_blocked,
        )

        e_risk = self.compute_environment_risk(
            environment_hazard=float(telemetry.get("environment_risk", 15.0))
        )

        crit_risk = profile.criticality_score

        # 1. Pure Physical Operating Risk (normalized combination of 5 physical hazards)
        w = self.weights
        physical_risk = (
            w.battery * b_risk
            + w.sensor * s_risk
            + w.communication * c_risk
            + w.obstacle * o_risk
            + w.environment * e_risk
        )
        physical_risk = round(min(100.0, max(0.0, physical_risk)), 1)

        # 2. Mission Context: Criticality sensitivity multiplier
        # Routine Inspection (Crit: 20) -> 0.85x sensitivity
        # Surveillance (Crit: 50)       -> 1.00x sensitivity (baseline)
        # Emergency Delivery (Crit: 80) -> 1.15x sensitivity
        # Critical Rescue (Crit: 95)    -> 1.225x sensitivity
        context_multiplier = round(0.75 + 0.50 * (profile.criticality_score / 100.0), 3)

        # 3. AI Anomaly Advisory Signal
        is_anomaly, anomaly_score = anomaly_engine.detect(telemetry, prev_battery=prev_battery)
        anomaly_penalty = round(min(15.0, anomaly_score * 10.0), 1) if is_anomaly else 0.0

        # 4. Composite Mission Risk Score
        composite = round(min(100.0, max(0.0, physical_risk * context_multiplier + anomaly_penalty)), 1)
        level = self.get_risk_level(composite)

        # 5. Mission Risk Budget Status
        budget_exceeded = composite > profile.risk_budget

        # 6. Trend Analysis (Velocity of risk change)
        trend = "STABLE"
        if risk_history and len(risk_history) >= 2:
            recent = risk_history[-5:] + [composite]
            if len(recent) >= 2:
                slope = (recent[-1] - recent[0]) / (len(recent) - 1)
                if slope >= 4.0:
                    trend = "RAPIDLY_RISING"
                elif slope >= 1.0:
                    trend = "RISING"
                elif slope <= -1.0:
                    trend = "FALLING"
                else:
                    trend = "STABLE"

        return RiskBreakdown(
            battery_risk=b_risk,
            sensor_risk=s_risk,
            communication_risk=c_risk,
            obstacle_risk=o_risk,
            environment_risk=e_risk,
            physical_risk=physical_risk,
            mission_criticality=profile.criticality_score,
            risk_budget=profile.risk_budget,
            budget_exceeded=budget_exceeded,
            context_multiplier=context_multiplier,
            composite_risk=composite,
            risk_level=level,
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            risk_trend=trend,
        )


risk_engine = RiskEngine()
