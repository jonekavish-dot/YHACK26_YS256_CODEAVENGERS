"""
MIRA Robot Digital Twin & Mission Simulator
Deterministic simulation engine managing clock ticks, kinematics, telemetry updates, and fault injections.
"""
import time
import math
from typing import List, Tuple, Dict, Any, Optional
from backend.app.config import (
    DEPOT_POS,
    MEDICAL_CAMP_POS,
    SAFE_ZONE_POS,
    STATIC_OBSTACLES,
    HAZARD_ZONES,
    MISSION_PROFILES,
)
from backend.app.schemas.types import (
    Telemetry,
    RiskBreakdown,
    MissionDecision,
    Route,
    ModeEnum,
    ActionEnum,
    RiskLevelEnum,
    MissionMetrics,
    SimulationState,
)
from backend.app.services.risk_engine import risk_engine
from backend.app.services.safety_governor import safety_governor
from backend.app.services.explanation_engine import explanation_engine
from backend.app.models.database import db
from .planner import GridPlanner
from .baseline_evaluator import baseline_evaluator


class RobotSimulator:
    def __init__(self):
        self.mission_id: str = "MISSION-2026-MED01"
        self.mission_profile_key: str = "EMERGENCY_DELIVERY"
        self.mission_name: str = MISSION_PROFILES[self.mission_profile_key].name
        self.robot_id: str = "R01"

        self.planner = GridPlanner()
        self.is_running: bool = False
        self.is_paused: bool = False
        self.sim_speed: float = 1.0
        self.step_count: int = 0
        self.start_time: float = time.time()

        # Telemetry & Health States
        self.pos: Tuple[int, int] = DEPOT_POS
        self.route_index: int = 0
        self.battery: float = 85.0
        self.prev_battery: float = 85.0
        self.sensor_health: float = 96.0
        self.comm_latency: float = 45.0
        self.comm_reliability: float = 98.0
        self.speed: float = 1.0
        self.energy_rate: float = 1.2
        self.current_mode: ModeEnum = ModeEnum.NORMAL
        self.env_risk_override: Optional[float] = None

        # Navigation routes
        self.active_route: Optional[Route] = None
        self.candidate_routes: List[Route] = []
        self.safe_return_route: Optional[Route] = None

        # Cumulative Metrics
        self.distance_traveled: float = 0.0
        self.energy_consumed: float = 0.0
        self.replanning_count: int = 0
        self.near_misses: int = 0
        self.collisions: int = 0
        self.risk_scores_history: List[float] = []
        self.degraded_mode_ticks: int = 0

        # Latest evaluation records
        self.current_telemetry: Telemetry = self._build_telemetry()
        self.current_risk: RiskBreakdown = RiskBreakdown()
        self.current_decision: MissionDecision = MissionDecision(
            action=ActionEnum.CONTINUE,
            mode=ModeEnum.NORMAL,
            reason="Mission initialized.",
            selected_route_id=None,
            explanation=explanation_engine.explain_decision(
                self.current_telemetry,
                self.current_risk,
                ActionEnum.CONTINUE,
                ModeEnum.NORMAL,
                None,
                None,
            ),
            timestamp=time.time(),
        )

        self.reset(self.mission_profile_key)

    def reset(self, mission_profile_key: str = "EMERGENCY_DELIVERY"):
        self.mission_profile_key = mission_profile_key
        self.mission_name = MISSION_PROFILES.get(mission_profile_key, MISSION_PROFILES["EMERGENCY_DELIVERY"]).name
        self.mission_id = f"MISSION-{int(time.time()) % 10000:04d}"

        self.pos = DEPOT_POS
        self.route_index = 0
        self.battery = 85.0
        self.prev_battery = 85.0
        self.sensor_health = 96.0
        self.comm_latency = 45.0
        self.comm_reliability = 98.0
        self.speed = 1.0
        self.energy_rate = 1.2
        self.current_mode = ModeEnum.NORMAL
        self.env_risk_override = None

        self.step_count = 0
        self.start_time = time.time()
        self.is_running = True
        self.is_paused = False
        self.sim_speed = 1.0

        self.distance_traveled = 0.0
        self.energy_consumed = 0.0
        self.replanning_count = 0
        self.near_misses = 0
        self.collisions = 0
        self.risk_scores_history = []
        self.degraded_mode_ticks = 0

        self.planner.clear_dynamic_obstacles()
        self._replan_all_routes()
        self._evaluate_cycle()

        db.log_mission_start(self.mission_id, self.mission_profile_key, self.mission_name)
        db.log_event(self.mission_id, "MISSION_START", f"Mission started: {self.mission_name}", 0.0, self.current_risk.composite_risk, "CONTINUE")

    def _build_telemetry(self) -> Telemetry:
        min_obs_dist, density = self._calculate_obstacle_metrics()
        cell_env_risk = self.env_risk_override if self.env_risk_override is not None else self.planner.get_cell_hazard(self.pos)
        progress = 0.0
        if self.active_route and len(self.active_route.points) > 1:
            progress = min(100.0, round((self.route_index / max(len(self.active_route.points) - 1, 1)) * 100, 1))

        return Telemetry(
            robot_id=self.robot_id,
            x=self.pos[0],
            y=self.pos[1],
            battery=round(max(0.0, min(100.0, self.battery)), 1),
            sensor_health=round(max(0.0, min(100.0, self.sensor_health)), 1),
            communication_latency=round(self.comm_latency, 1),
            communication_reliability=round(self.comm_reliability, 1),
            speed=round(self.speed, 2),
            obstacle_distance=round(min_obs_dist, 1),
            obstacle_density=round(density, 2),
            environment_risk=round(cell_env_risk, 1),
            mission_priority=round(MISSION_PROFILES[self.mission_profile_key].criticality_score / 100.0, 2),
            mission_progress=progress,
            energy_consumption_rate=round(self.energy_rate, 2),
            current_mode=self.current_mode,
            timestamp=round(time.time(), 2),
        )

    def _calculate_obstacle_metrics(self) -> Tuple[float, float]:
        min_dist = float("inf")
        nearby_count = 0
        check_radius = 5.0

        all_obstacles = list(self.planner.static_obstacles | self.planner.dynamic_obstacles)
        for ox, oy in all_obstacles:
            d = math.hypot(self.pos[0] - ox, self.pos[1] - oy)
            if d < min_dist:
                min_dist = d
            if d <= check_radius:
                nearby_count += 1

        density = min(1.0, nearby_count / 25.0)
        return (min_dist if min_dist != float("inf") else 15.0, density)

    def _replan_all_routes(self):
        self.candidate_routes = self.planner.generate_candidate_routes(self.pos, MEDICAL_CAMP_POS)
        self.safe_return_route = self.planner.plan_safe_return(self.pos)

        unblocked = [r for r in self.candidate_routes if not r.is_blocked]
        if unblocked:
            self.active_route = min(unblocked, key=lambda r: r.total_score)
            self.route_index = 0
        elif self.candidate_routes:
            self.active_route = self.candidate_routes[0]
            self.route_index = 0
        else:
            self.active_route = None

    def _evaluate_cycle(self):
        self.current_telemetry = self._build_telemetry()

        is_route_blocked = False
        if self.active_route:
            rem_points = self.active_route.points[self.route_index:]
            for p in rem_points:
                if self.planner.is_blocked(p):
                    is_route_blocked = True
                    break

        self.current_risk = risk_engine.evaluate(
            telemetry=self.current_telemetry.model_dump(),
            mission_profile_key=self.mission_profile_key,
            route_blocked=is_route_blocked,
            prev_battery=self.prev_battery,
        )

        self.prev_battery = self.battery
        self.risk_scores_history.append(self.current_risk.composite_risk)

        decision = safety_governor.decide(
            telemetry=self.current_telemetry,
            risk=self.current_risk,
            active_route=self.active_route,
            candidate_routes=self.candidate_routes,
            safe_return_route=self.safe_return_route,
            mission_profile_key=self.mission_profile_key,
            timestamp=time.time(),
        )

        self.current_mode = decision.mode

        if decision.mode == ModeEnum.DEGRADED_AUTONOMY:
            self.degraded_mode_ticks += 1
            self.speed = 0.6
        elif decision.action == ActionEnum.SLOW_DOWN:
            self.speed = 0.5
        elif self.sensor_health < 70.0:
            self.speed = 0.6
        elif decision.action == ActionEnum.EMERGENCY_STOP:
            self.speed = 0.0
            self.is_running = False
        else:
            self.speed = 1.0

        if decision.selected_route_id and (self.active_route is None or decision.selected_route_id != self.active_route.id):
            all_opts = self.candidate_routes + ([self.safe_return_route] if self.safe_return_route else [])
            selected = next((r for r in all_opts if r.id == decision.selected_route_id), None)
            if selected:
                prev_name = self.active_route.name if self.active_route else "None"
                self.active_route = selected
                self.route_index = 0
                self.replanning_count += 1
                db.log_event(
                    self.mission_id,
                    "REPLAN",
                    f"Route altered from {prev_name} to {selected.name}",
                    self.current_risk.composite_risk,
                    selected.risk_cost,
                    decision.action.value,
                )

        self.current_decision = decision

        db.log_decision(
            self.mission_id,
            self.step_count,
            decision.action.value,
            decision.mode.value,
            decision.reason,
            decision.explanation.tradeoff_summary,
        )

    def tick(self):
        if not self.is_running or self.is_paused:
            return

        self.step_count += 1

        if self.active_route and self.route_index < len(self.active_route.points) - 1:
            next_pos = self.active_route.points[self.route_index + 1]

            if self.planner.is_blocked(next_pos):
                self._replan_all_routes()
            else:
                self.route_index += 1
                prev_pos = self.pos
                self.pos = next_pos
                step_dist = math.hypot(self.pos[0] - prev_pos[0], self.pos[1] - prev_pos[1])
                self.distance_traveled += step_dist

                terrain_mult = 1.0 + (self.planner.get_cell_hazard(self.pos) / 100.0) * 0.5
                step_drain = 0.25 * self.speed * self.energy_rate * terrain_mult
                self.battery = max(0.0, self.battery - step_drain)
                self.energy_consumed += step_drain

        elif self.active_route and self.route_index >= len(self.active_route.points) - 1:
            if self.pos == MEDICAL_CAMP_POS:
                self.is_running = False
                db.log_event(self.mission_id, "MISSION_SUCCESS", "Robot safely arrived at Medical Camp destination!", self.current_risk.composite_risk, 0.0, "COMPLETE")
            elif self.pos == SAFE_ZONE_POS:
                self.is_running = False
                db.log_event(self.mission_id, "SAFE_ARRIVAL", "Robot safely reached Safe Recovery Zone.", self.current_risk.composite_risk, 0.0, "COMPLETE")

        self._evaluate_cycle()

        db.log_telemetry(
            self.mission_id,
            self.step_count,
            self.current_telemetry.model_dump(),
            self.current_risk.composite_risk,
            self.current_mode.value,
        )

    def inject_dynamic_obstacle(self, pos: Optional[Tuple[int, int]] = None):
        risk_before = self.current_risk.composite_risk
        target_pos = pos

        if not target_pos and self.active_route:
            ahead_idx = min(self.route_index + 3, len(self.active_route.points) - 1)
            target_pos = self.active_route.points[ahead_idx]

        if not target_pos:
            target_pos = (self.pos[0] + 2, self.pos[1] + 2)

        self.planner.add_dynamic_obstacle(target_pos)
        self._replan_all_routes()
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "DYNAMIC_OBSTACLE",
            f"Dynamic obstacle appeared at {target_pos}",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def inject_battery_drain(self, drop_to_pct: float = 48.0):
        risk_before = self.current_risk.composite_risk
        self.battery = drop_to_pct
        self.energy_rate = 1.8
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "BATTERY_DRAIN",
            f"Battery dropped to {drop_to_pct}% (consumption rate adjusted to 1.8 W/m)",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def inject_sensor_degradation(self, health_pct: float = 48.0):
        risk_before = self.current_risk.composite_risk
        self.sensor_health = health_pct
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "SENSOR_DEGRADATION",
            f"Perception sensor health degraded to {health_pct}%",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def inject_communication_latency(self, latency_ms: float = 480.0, reliability_pct: float = 68.0):
        risk_before = self.current_risk.composite_risk
        self.comm_latency = latency_ms
        self.comm_reliability = reliability_pct
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "COMM_DEGRADATION",
            f"Comm latency increased to {latency_ms}ms, reliability dropped to {reliability_pct}%",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def inject_environment_hazard(self, hazard_pct: float = 85.0):
        risk_before = self.current_risk.composite_risk
        self.env_risk_override = hazard_pct
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "ENV_HAZARD",
            f"Environmental hazard escalated to {hazard_pct}%",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def inject_combined_fault(self):
        risk_before = self.current_risk.composite_risk
        self.battery = 24.0
        self.sensor_health = 46.0
        self.comm_latency = 420.0
        self.comm_reliability = 70.0

        if self.active_route and len(self.active_route.points) > self.route_index + 2:
            obs_pt = self.active_route.points[self.route_index + 2]
            self.planner.add_dynamic_obstacle(obs_pt)

        self._replan_all_routes()
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "COMBINED_FAULT",
            "Severe compound fault injected across battery, sensor, comms, and obstacle path.",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def recover_system(self):
        risk_before = self.current_risk.composite_risk
        self.battery = 88.0
        self.sensor_health = 98.0
        self.comm_latency = 38.0
        self.comm_reliability = 99.0
        self.energy_rate = 1.1
        self.env_risk_override = None
        self.planner.clear_dynamic_obstacles()

        self._replan_all_routes()
        self._evaluate_cycle()

        db.log_event(
            self.mission_id,
            "SYSTEM_RECOVERED",
            "Subsystems recovered to nominal parameters. Dynamic obstacles cleared.",
            risk_before,
            self.current_risk.composite_risk,
            self.current_decision.action.value,
        )

    def get_metrics(self) -> MissionMetrics:
        avg_risk = (
            sum(self.risk_scores_history) / max(len(self.risk_scores_history), 1)
            if self.risk_scores_history else 0.0
        )
        peak_risk = max(self.risk_scores_history) if self.risk_scores_history else 0.0
        comparison = baseline_evaluator.run_comparison(
            dynamic_obstacles=list(self.planner.dynamic_obstacles),
            sensor_health=self.sensor_health,
            battery_start=85.0,
            comm_latency=self.comm_latency,
        )

        return MissionMetrics(
            mission_id=self.mission_id,
            status="RUNNING" if self.is_running else "COMPLETED",
            duration_seconds=round(time.time() - self.start_time, 1),
            distance_traveled=round(self.distance_traveled, 1),
            energy_consumed=round(self.energy_consumed, 1),
            replanning_count=self.replanning_count,
            near_miss_count=self.near_misses,
            collision_count=self.collisions,
            avg_risk_score=round(avg_risk, 1),
            peak_risk_score=round(peak_risk, 1),
            degraded_autonomy_seconds=round(self.degraded_mode_ticks * 0.5, 1),
            baseline_comparison=comparison,
        )

    def get_state(self) -> SimulationState:
        return SimulationState(
            mission_id=self.mission_id,
            mission_type=self.mission_profile_key,
            mission_name=self.mission_name,
            robot_id=self.robot_id,
            x=self.pos[0],
            y=self.pos[1],
            telemetry=self.current_telemetry,
            risk=self.current_risk,
            decision=self.current_decision,
            current_route=self.active_route.points if self.active_route else [],
            candidate_routes=self.candidate_routes,
            dynamic_obstacles=list(self.planner.dynamic_obstacles),
            static_obstacles=list(self.planner.static_obstacles),
            depot=DEPOT_POS,
            medical_camp=MEDICAL_CAMP_POS,
            safe_zone=SAFE_ZONE_POS,
            is_running=self.is_running,
            is_paused=self.is_paused,
            sim_speed=self.sim_speed,
            step_count=self.step_count,
            metrics=self.get_metrics(),
        )


simulator = RobotSimulator()

