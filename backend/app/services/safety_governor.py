"""
MIRA Safety Governor - Mission-Level Decision Engine
Governs robot behavioral states based on risk budget, telemetry health, and route safety.
"""
from typing import List, Optional, Tuple
from ..config import MISSION_PROFILES, SAFE_RETURN_RESERVE_PCT
from ..schemas.types import (
    ActionEnum,
    ModeEnum,
    RiskLevelEnum,
    RiskBreakdown,
    MissionDecision,
    Explanation,
    Route,
    Telemetry,
)


class SafetyGovernor:
    def decide(
        self,
        telemetry: Telemetry,
        risk: RiskBreakdown,
        active_route: Optional[Route],
        candidate_routes: List[Route],
        safe_return_route: Optional[Route],
        mission_profile_key: str = "EMERGENCY_DELIVERY",
        timestamp: float = 0.0,
    ) -> MissionDecision:
        profile = MISSION_PROFILES.get(
            mission_profile_key, MISSION_PROFILES["EMERGENCY_DELIVERY"]
        )
        budget = profile.risk_budget

        drivers: List[str] = []
        if risk.battery_risk > 50:
            drivers.append(f"Battery risk elevated ({risk.battery_risk:.0f}%)")
        if risk.sensor_risk > 50:
            drivers.append(f"Sensor perception degraded ({telemetry.sensor_health:.0f}% health)")
        if risk.communication_risk > 50:
            drivers.append(f"Communication degraded ({telemetry.communication_latency:.0f}ms latency)")
        if risk.obstacle_risk > 50:
            drivers.append(f"Obstacle hazard near route ({telemetry.obstacle_distance:.1f}m)")
        if risk.environment_risk > 50:
            drivers.append(f"High environmental hazard ({telemetry.environment_risk:.0f}%)")
        if risk.is_anomaly:
            drivers.append(f"AI telemetry anomaly detected (score: {risk.anomaly_score:.2f})")

        # 1. Critical Battery Check: If battery is insufficient to reach goal and reserve is threatened
        # Check if safe return is urgent
        is_path_blocked = active_route.is_blocked if active_route else False
        battery_critically_low = telemetry.battery <= SAFE_RETURN_RESERVE_PCT or risk.battery_risk >= 85.0

        if battery_critically_low:
            if safe_return_route and not safe_return_route.is_blocked:
                return MissionDecision(
                    action=ActionEnum.RETURN_TO_SAFE_ZONE,
                    mode=ModeEnum.SAFE_RETURN,
                    reason="Battery level reached critical return threshold. Evacuating to safe zone.",
                    selected_route_id=safe_return_route.id,
                    explanation=Explanation(
                        primary_drivers=drivers or ["Battery margin depletion"],
                        rationale="Remaining battery insufficient for guaranteed mission completion without stranding.",
                        recommended_action="Abort direct mission and divert to designated safe charging zone.",
                        tradeoff_summary=f"Divert to Safe Zone ({safe_return_route.length}m) to avoid critical vehicle loss."
                    ),
                    timestamp=timestamp,
                )
            else:
                return MissionDecision(
                    action=ActionEnum.EMERGENCY_STOP,
                    mode=ModeEnum.EMERGENCY_STOP,
                    reason="Battery exhausted and safe return route unviable. Controlled emergency stop.",
                    selected_route_id=None,
                    explanation=Explanation(
                        primary_drivers=drivers,
                        rationale="Critical energy depletion with no traversable safe path.",
                        recommended_action="Engage holding brake and await retrieval.",
                        tradeoff_summary="Stop vehicle to preserve electronics and teleoperation heartbeat."
                    ),
                    timestamp=timestamp,
                )

        # 2. Severe Communication Failure: DEGRADED AUTONOMY MODE
        if telemetry.communication_latency > 250.0 or telemetry.communication_reliability < 80.0:
            # If path is blocked, still need to replan locally
            selected_route = active_route
            action = ActionEnum.DEGRADED_AUTONOMY
            reason = "Communication degradation detected. Operating in autonomous fail-safe mode."

            if is_path_blocked:
                # Find best unblocked alternative
                valid_alternatives = [r for r in candidate_routes if not r.is_blocked]
                if valid_alternatives:
                    # Pick safest available
                    safest = min(valid_alternatives, key=lambda r: r.total_score)
                    selected_route = safest
                    action = ActionEnum.REPLAN
                    reason = "Dynamic obstacle blocked path under degraded comms; executing local autonomous replan."

            return MissionDecision(
                action=action,
                mode=ModeEnum.DEGRADED_AUTONOMY,
                reason=reason,
                selected_route_id=selected_route.id if selected_route else None,
                explanation=Explanation(
                    primary_drivers=drivers or ["High network latency / packet jitter"],
                    rationale="Base station link impaired. Transitioning to localized safety governor policy with expanded obstacle margins.",
                    recommended_action="Reduce operational speed by 40%, rely on onboard lidar/ultrasonic sensing.",
                    tradeoff_summary="Reduced speed (-40%) for guaranteed onboard collision avoidance."
                ),
                timestamp=timestamp,
            )

        # 3. Path Obstruction: MUST REPLAN
        if is_path_blocked:
            valid_alternatives = [r for r in candidate_routes if not r.is_blocked and r.id != (active_route.id if active_route else "")]
            if not valid_alternatives:
                # Try all candidate routes
                valid_alternatives = [r for r in candidate_routes if not r.is_blocked]

            if valid_alternatives:
                best_alternative = min(valid_alternatives, key=lambda r: r.total_score)
                dist_delta = round(best_alternative.length - (active_route.length if active_route else best_alternative.length), 1)
                risk_reduction = round(max(0.0, ((active_route.risk_cost if active_route else 80) - best_alternative.risk_cost)), 1)

                return MissionDecision(
                    action=ActionEnum.REPLAN,
                    mode=ModeEnum.NORMAL,
                    reason=f"Active path obstructed. Autonomous replan to {best_alternative.name}.",
                    selected_route_id=best_alternative.id,
                    explanation=Explanation(
                        primary_drivers=drivers or ["Obstacle directly blocking current route"],
                        rationale="Dynamic obstacle detected on current trajectory. Switch to safety corridor.",
                        recommended_action=f"Adopt {best_alternative.name} bypass corridor.",
                        tradeoff_summary=f"{'+' if dist_delta >= 0 else ''}{dist_delta}m distance, -{risk_reduction}% route risk exposure"
                    ),
                    timestamp=timestamp,
                )
            else:
                # No goal route available, evacuate to safe zone
                if safe_return_route and not safe_return_route.is_blocked:
                    return MissionDecision(
                        action=ActionEnum.RETURN_TO_SAFE_ZONE,
                        mode=ModeEnum.SAFE_RETURN,
                        reason="All goal corridors obstructed. Diverting to safe zone.",
                        selected_route_id=safe_return_route.id,
                        explanation=Explanation(
                            primary_drivers=drivers,
                            rationale="No obstacle-free path to destination exists.",
                            recommended_action="Proceed to safe fallback area.",
                            tradeoff_summary="Preserve robot integrity until obstacle clears."
                        ),
                        timestamp=timestamp,
                    )
                else:
                    return MissionDecision(
                        action=ActionEnum.EMERGENCY_STOP,
                        mode=ModeEnum.EMERGENCY_STOP,
                        reason="All corridors fully obstructed. Emergency halt.",
                        selected_route_id=None,
                        explanation=Explanation(
                            primary_drivers=drivers,
                            rationale="No traversable route found in any direction.",
                            recommended_action="Halt immediately to prevent collision.",
                            tradeoff_summary="Hold position."
                        ),
                        timestamp=timestamp,
                    )

        # 4. Risk Budget Exceeded Check
        if risk.composite_risk > budget:
            # Check if an alternative route offers lower risk
            safer_alternatives = [
                r for r in candidate_routes
                if not r.is_blocked and (active_route is None or r.risk_cost < active_route.risk_cost)
            ]
            if safer_alternatives:
                safest = min(safer_alternatives, key=lambda r: r.total_score)
                dist_delta = round(safest.length - (active_route.length if active_route else safest.length), 1)
                risk_diff = round((active_route.risk_cost if active_route else safest.risk_cost) - safest.risk_cost, 1)

                return MissionDecision(
                    action=ActionEnum.REPLAN,
                    mode=ModeEnum.NORMAL,
                    reason=f"Mission risk ({risk.composite_risk:.0f}) exceeded budget ({budget:.0f}). Switching to lower-risk route.",
                    selected_route_id=safest.id,
                    explanation=Explanation(
                        primary_drivers=drivers,
                        rationale=f"Mission tolerance ({budget:.0f}) breached by ambient risk factors.",
                        recommended_action=f"Switch to {safest.name}.",
                        tradeoff_summary=f"{'+' if dist_delta >= 0 else ''}{dist_delta}m distance, -{risk_diff}% route risk"
                    ),
                    timestamp=timestamp,
                )

            # If sensor health is poor or risk is in caution range, SLOW_DOWN
            if telemetry.sensor_health < 75.0 or risk.risk_level in [RiskLevelEnum.YELLOW, RiskLevelEnum.ORANGE]:
                return MissionDecision(
                    action=ActionEnum.SLOW_DOWN,
                    mode=ModeEnum.NORMAL,
                    reason=f"Elevated risk ({risk.composite_risk:.0f}). Reducing speed to widen reaction horizon.",
                    selected_route_id=active_route.id if active_route else None,
                    explanation=Explanation(
                        primary_drivers=drivers,
                        rationale="Environmental/sensor uncertainty requires larger perception braking window.",
                        recommended_action="Reduce traversal speed to 0.5 m/s.",
                        tradeoff_summary="Travel time +25% for 40% wider safety reaction margin."
                    ),
                    timestamp=timestamp,
                )

        # 5. Normal Nominal Operations
        return MissionDecision(
            action=ActionEnum.CONTINUE,
            mode=ModeEnum.NORMAL,
            reason=f"Mission risk ({risk.composite_risk:.0f}) within budget ({budget:.0f}). Nominal navigation active.",
            selected_route_id=active_route.id if active_route else None,
            explanation=Explanation(
                primary_drivers=drivers or ["All systems nominal"],
                rationale="Telemetry within expected parameters. Current route optimal.",
                recommended_action="Continue along planned trajectory.",
                tradeoff_summary="Optimal speed & energy efficiency maintained."
            ),
            timestamp=timestamp,
        )


safety_governor = SafetyGovernor()
