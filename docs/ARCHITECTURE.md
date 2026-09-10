# MIRA System Architecture & Technical Specification

## 1. Overview
MIRA (Mission Intelligence & Risk-Aware Autonomy) operates as an intelligent mission-level safety governor situated between high-level operational commands and low-level path navigation.

```
                           MIRA
                             |
                    Mission Manager
                             |
                     Robot Digital Twin
                             |
                 +-----------+-----------+
                 |           |           |
             Telemetry   Environment   Mission
                 |           |           |
                 +-----------+-----------+
                             |
                       Feature Engine
                             |
                 +-----------------------+
                 |  Hybrid Risk Engine   |
                 |                       |
                 |  Rule-Based Risk      |
                 |  +                    |
                 |  ML Anomaly Detection |
                 +-----------+-----------+
                             |
                    Mission Risk Score
                             |
                      Safety Governor
                             |
             +---------------+---------------+
             |         |          |          |
          Continue   Slow Down   Replan   Degraded Mode / Safe Return
                             |
                     A* Risk Planner
                             |
                      Robot Action
                             |
                     Live Telemetry Loop
```

---

## 2. Risk Calculation Formula & Weights
The Composite Mission Risk is calculated continuously as a normalized 0–100 index:

$$\text{MissionRisk} = 0.20 \cdot B + 0.20 \cdot S + 0.15 \cdot C + 0.20 \cdot O + 0.10 \cdot E + 0.15 \cdot \text{Crit}$$

### Factor Definitions:
1. **Battery Risk ($B$)**:
   $$\text{Margin} = \text{Battery} - \text{ReserveNeeded}(\text{dist to safe zone})$$
   If $\text{Battery} \le \text{ReserveNeeded}$, risk spikes to 75–100.
2. **Sensor Risk ($S$)**:
   Models camera and lidar perception attenuation. Under 60% health, perception confidence collapses, requiring wider braking envelopes.
3. **Communication Risk ($C$)**:
   Weighted blend of round-trip latency ($55\%$) and packet reliability ($45\%$).
4. **Obstacle Risk ($O$)**:
   Spatial proximity to dynamic obstacles, local clutter density, and corridor obstruction flags.
5. **Environment Risk ($E$)**:
   Direct environmental hazard index of the traversed zone (chemical leaks, rough terrain, RF interference).
6. **Mission Criticality ($\text{Crit}$)**:
   Dynamic penalty weight defined by the mission profile (`ROUTINE_INSPECTION`: 20, `SURVEILLANCE`: 50, `EMERGENCY_DELIVERY`: 80, `CRITICAL_RESCUE`: 95).

---

## 3. Safety Governor Decision Policy
The Safety Governor enforces deterministic, explainable actions:
- **`CONTINUE`**: Risk $\le$ risk budget. Cruise velocity (1.0 m/s).
- **`SLOW_DOWN`**: Sensor health $< 70\%$ or caution range. Speed reduced to 0.5 m/s.
- **`REPLAN`**: Current path obstructed or lower-risk safety corridor found.
- **`DEGRADED_AUTONOMY`**: Latency $> 250$ms or packet reliability $< 80\%$. Enforces local onboard safety policy and expands obstacle buffers.
- **`RETURN_TO_SAFE_ZONE`**: Battery reaches return reserve floor or compound catastrophic hazards block all forward paths.
- **`EMERGENCY_STOP`**: All paths obstructed with immediate collision hazard.

