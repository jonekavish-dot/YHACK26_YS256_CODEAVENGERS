"""
MIRA vs Baseline Evaluator
Runs deterministic comparative simulations between pure Shortest-Path Navigation and MIRA Risk-Aware Autonomy.
"""
from typing import Dict, Any, List, Tuple
import math
from backend.app.config import DEPOT_POS, MEDICAL_CAMP_POS, STATIC_OBSTACLES, HAZARD_ZONES
from simulation.scenarios import SCENARIOS
from .planner import GridPlanner


class BaselineEvaluator:
    def __init__(self):
        self.planner = GridPlanner()

    def run_comparison(
        self,
        dynamic_obstacles: List[Tuple[int, int]],
        sensor_health: float = 96.0,
        battery_start: float = 85.0,
        comm_latency: float = 45.0,
    ) -> Dict[str, Any]:
        planner = GridPlanner()
        planner.set_dynamic_obstacles(dynamic_obstacles)

        # Baseline: A* with risk_weight = 0.0 (pure distance)
        baseline_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS, risk_weight=0.0)

        # MIRA: A* with risk_weight = 2.5 (safety corridor)
        mira_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS, risk_weight=2.5)

        if not baseline_path:
            baseline_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS, risk_weight=0.05)
        if not mira_path:
            mira_path = planner.a_star(DEPOT_POS, MEDICAL_CAMP_POS, risk_weight=1.5)

        def evaluate_path_execution(path: List[Tuple[int, int]], is_mira: bool) -> Dict[str, Any]:
            if not path or len(path) < 2:
                return {
                    "success": False,
                    "distance": 0.0,
                    "energy_consumed": 0.0,
                    "avg_risk": 100.0,
                    "risk_exposure": 100.0,
                    "collisions": 1,
                    "near_misses": 3,
                    "time_seconds": 0.0,
                }

            distance = 0.0
            total_risk = 0.0
            risk_exposure = 0.0
            collisions = 0
            near_misses = 0

            # Baseline maintains 1.0 m/s regardless of perception health;
            # MIRA's safety governor throttles to 0.6 m/s when sensor is degraded
            speed = 1.0 if not is_mira else (0.6 if sensor_health < 70.0 else 1.0)

            for i in range(len(path) - 1):
                p1 = path[i]
                p2 = path[i + 1]
                step_dist = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
                distance += step_dist

                min_obs_dist = float("inf")
                for ox, oy in dynamic_obstacles:
                    d = math.hypot(p2[0] - ox, p2[1] - oy)
                    if d < min_obs_dist:
                        min_obs_dist = d

                # Identical spatial collision and near-miss criteria for both
                if min_obs_dist <= 0.5:
                    collisions += 1
                elif min_obs_dist <= 1.5:
                    near_misses += 1

                cell_hazard = planner.get_cell_hazard(p2)
                cell_clearance = planner.get_obstacle_proximity_penalty(p2)
                proximity_threat = 50.0 if min_obs_dist <= 1.0 else (20.0 if min_obs_dist <= 2.0 else 0.0)

                # Identical physical risk calculation for both policies
                step_risk = min(100.0, cell_hazard + cell_clearance + proximity_threat)
                total_risk += step_risk

                # Real Risk Exposure metric: sum of risk exceeding nominal safe threshold of 30.0
                if step_risk > 30.0:
                    risk_exposure += (step_risk - 30.0)

            avg_risk = total_risk / max(len(path) - 1, 1)
            time_seconds = distance / speed
            # Physics-grounded energy model: 1.0 Wh/m at nominal speed, 0.85 Wh/m when throttled
            energy_rate = 1.0 if speed >= 1.0 else 0.85
            energy_consumed = distance * energy_rate

            return {
                "success": collisions == 0,
                "distance": round(distance, 1),
                "energy_consumed": round(energy_consumed, 1),
                "avg_risk": round(min(100.0, avg_risk), 1),
                "risk_exposure": round(risk_exposure, 1),
                "collisions": collisions,
                "near_misses": near_misses,
                "time_seconds": round(time_seconds, 1),
            }

        baseline_metrics = evaluate_path_execution(baseline_path or [], is_mira=False)
        mira_metrics = evaluate_path_execution(mira_path or [], is_mira=True)

        risk_reduction_pct = round(
            max(0.0, ((baseline_metrics["avg_risk"] - mira_metrics["avg_risk"]) / max(baseline_metrics["avg_risk"], 1.0)) * 100),
            1
        )
        risk_exposure_reduction_pct = round(
            max(0.0, ((baseline_metrics["risk_exposure"] - mira_metrics["risk_exposure"]) / max(baseline_metrics["risk_exposure"], 1.0)) * 100),
            1
        )

        return {
            "baseline": {
                "name": "Shortest-Path Baseline (Dijkstra/A* Distance)",
                **baseline_metrics,
            },
            "mira": {
                "name": "MIRA Risk-Aware Autonomy Governor",
                **mira_metrics,
            },
            "risk_reduction_pct": risk_reduction_pct,
            "risk_exposure_reduction_pct": risk_exposure_reduction_pct,
        }

    def run_deterministic_scenarios(self) -> Dict[str, Any]:
        """
        Runs deterministic comparative evaluation against all standard scenarios
        defined in scenarios.py under identical initial conditions.
        """
        results: Dict[str, Any] = {}
        for sc_id, sc in SCENARIOS.items():
            comp = self.run_comparison(
                dynamic_obstacles=sc.get("obstacles", []),
                sensor_health=sc.get("initial_sensor", 95.0),
                battery_start=sc.get("initial_battery", 85.0),
                comm_latency=sc.get("initial_latency", 40.0),
            )
            results[sc_id] = {
                "name": sc.get("name", sc_id),
                "description": sc.get("description", ""),
                "baseline_success": comp["baseline"]["success"],
                "baseline_collisions": comp["baseline"]["collisions"],
                "baseline_near_misses": comp["baseline"]["near_misses"],
                "baseline_risk": comp["baseline"]["avg_risk"],
                "baseline_exposure": comp["baseline"]["risk_exposure"],
                "mira_success": comp["mira"]["success"],
                "mira_collisions": comp["mira"]["collisions"],
                "mira_near_misses": comp["mira"]["near_misses"],
                "mira_risk": comp["mira"]["avg_risk"],
                "mira_exposure": comp["mira"]["risk_exposure"],
                "risk_reduction_pct": comp["risk_reduction_pct"],
                "risk_exposure_reduction_pct": comp["risk_exposure_reduction_pct"],
            }
        return results

    def run_multi_trial_benchmark(self, num_trials: int = 20, seed: int = 42) -> Dict[str, Any]:
        """
        Executes a reproducible Monte Carlo benchmark over randomized dynamic obstacle and
        degraded sensor environments comparing Baseline vs MIRA.
        Uses identical physical risk calculations and collision thresholds for both.
        """
        import random
        rng = random.Random(seed)

        baseline_collisions = 0
        baseline_near_misses = 0
        baseline_risks = []
        baseline_exposures = []
        baseline_successes = 0

        mira_collisions = 0
        mira_near_misses = 0
        mira_risks = []
        mira_exposures = []
        mira_successes = 0

        for _ in range(num_trials):
            obs_count = rng.randint(2, 4)
            dyn_obs = []
            for _ in range(obs_count):
                ox = rng.randint(5, 24)
                oy = rng.randint(5, 24)
                if (ox, oy) != DEPOT_POS and (ox, oy) != MEDICAL_CAMP_POS:
                    dyn_obs.append((ox, oy))

            s_health = rng.uniform(65.0, 98.0)
            res = self.run_comparison(
                dynamic_obstacles=dyn_obs,
                sensor_health=s_health,
                battery_start=rng.uniform(70.0, 90.0),
                comm_latency=rng.uniform(30.0, 320.0),
            )

            b = res["baseline"]
            m = res["mira"]

            baseline_collisions += b["collisions"]
            baseline_near_misses += b["near_misses"]
            baseline_risks.append(b["avg_risk"])
            baseline_exposures.append(b["risk_exposure"])
            if b["success"]:
                baseline_successes += 1

            mira_collisions += m["collisions"]
            mira_near_misses += m["near_misses"]
            mira_risks.append(m["avg_risk"])
            mira_exposures.append(m["risk_exposure"])
            if m["success"]:
                mira_successes += 1

        b_avg_r = sum(baseline_risks) / max(len(baseline_risks), 1)
        m_avg_r = sum(mira_risks) / max(len(mira_risks), 1)
        b_avg_exp = sum(baseline_exposures) / max(len(baseline_exposures), 1)
        m_avg_exp = sum(mira_exposures) / max(len(mira_exposures), 1)

        risk_reduction = round(max(0.0, ((b_avg_r - m_avg_r) / max(b_avg_r, 1.0)) * 100), 1)
        exposure_reduction = round(max(0.0, ((b_avg_exp - m_avg_exp) / max(b_avg_exp, 1.0)) * 100), 1)

        return {
            "num_trials": num_trials,
            "random_seed": seed,
            "baseline": {
                "success_rate_pct": round((baseline_successes / num_trials) * 100, 1),
                "total_collisions": baseline_collisions,
                "total_near_misses": baseline_near_misses,
                "mean_risk": round(b_avg_r, 1),
                "mean_risk_exposure": round(b_avg_exp, 1),
            },
            "mira": {
                "success_rate_pct": round((mira_successes / num_trials) * 100, 1),
                "total_collisions": mira_collisions,
                "total_near_misses": mira_near_misses,
                "mean_risk": round(m_avg_r, 1),
                "mean_risk_exposure": round(m_avg_exp, 1),
            },
            "risk_reduction_pct": risk_reduction,
            "risk_exposure_reduction_pct": exposure_reduction,
            "scenario_breakdown": self.run_deterministic_scenarios(),
        }


baseline_evaluator = BaselineEvaluator()


