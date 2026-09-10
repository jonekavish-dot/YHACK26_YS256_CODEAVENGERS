"""
MIRA Explainability Engine
Translates telemetry anomalies, risk scores, and governor actions into human-understandable audit rationales.
"""
from typing import List, Optional
from ..schemas.types import RiskBreakdown, Telemetry, Route, ActionEnum, ModeEnum, Explanation


class ExplanationEngine:
    def explain_decision(
        self,
        telemetry: Telemetry,
        risk: RiskBreakdown,
        action: ActionEnum,
        mode: ModeEnum,
        active_route: Optional[Route],
        selected_route: Optional[Route],
    ) -> Explanation:
        drivers: List[str] = []

        if risk.battery_risk > 50.0:
            drivers.append(f"Battery below safe-return reserve: {telemetry.battery:.1f}% remaining")
        if risk.sensor_risk > 45.0:
            drivers.append(f"Sensor perception degraded to {telemetry.sensor_health:.0f}% health")
        if risk.communication_risk > 50.0:
            drivers.append(f"Link latency high: {telemetry.communication_latency:.0f}ms (jitter: {100-telemetry.communication_reliability:.0f}%)")
        if risk.obstacle_risk > 50.0:
            drivers.append(f"Proximity to obstacle hazard: {telemetry.obstacle_distance:.1f}m")
        if risk.environment_risk > 40.0:
            drivers.append(f"Navigating hazardous zone: {telemetry.environment_risk:.0f}% hazard level")
        if risk.is_anomaly:
            drivers.append(f"Telemetry outlier detected by Isolation Forest (anomaly score {risk.anomaly_score:.2f})")

        if not drivers:
            drivers.append("All subsystem telemetry nominal")

        # Formulate rationale
        if action == ActionEnum.RETURN_TO_SAFE_ZONE:
            rationale = (
                f"Battery reserve critical ({telemetry.battery:.1f}%). Traversal to goal would cause "
                f"vehicle stranding. Immediate diversion to safe charging zone commanded."
            )
            rec = "Divert immediately to designated safe recovery zone."
        elif action == ActionEnum.DEGRADED_AUTONOMY:
            rationale = (
                f"Communication link latency ({telemetry.communication_latency:.0f}ms) exceeds reliable "
                f"remote tele-governance threshold. Local autonomy governor assumed full control."
            )
            rec = "Reduce speed by 40%, widen obstacle clearance field, navigate via onboard sensors."
        elif action == ActionEnum.REPLAN:
            rationale = (
                f"Current trajectory compromised by obstacle proximity ({telemetry.obstacle_distance:.1f}m) "
                f"or risk budget breach. Recomputed optimal alternative path."
            )
            rec = f"Switch trajectory to {selected_route.name if selected_route else 'alternative corridor'}."
        elif action == ActionEnum.SLOW_DOWN:
            rationale = (
                f"Perception or environmental conditions require larger braking envelope. "
                f"Current risk is {risk.composite_risk:.0f}/100."
            )
            rec = "Reduce operational speed to 0.5 m/s until sensor confidence restores."
        elif action == ActionEnum.EMERGENCY_STOP:
            rationale = "No traversable corridors exist. Immediate vehicle halt executed to avert collision."
            rec = "Lock brakes, engage beacon, and await operator intervention."
        else:
            rationale = f"Telemetry healthy. Risk level {risk.composite_risk:.0f}/100 is within mission budget."
            rec = "Continue forward along planned trajectory."

        # Tradeoff summary
        tradeoff = None
        if selected_route and active_route and selected_route.id != active_route.id:
            dist_diff = selected_route.length - active_route.length
            risk_diff = active_route.risk_cost - selected_route.risk_cost
            sign = "+" if dist_diff >= 0 else ""
            tradeoff = f"{sign}{dist_diff:.1f}m travel distance, -{risk_diff:.1f}% route hazard exposure"

        return Explanation(
            primary_drivers=drivers,
            rationale=rationale,
            recommended_action=rec,
            tradeoff_summary=tradeoff,
        )


explanation_engine = ExplanationEngine()
