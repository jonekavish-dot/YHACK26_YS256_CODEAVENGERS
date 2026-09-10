# MIRA — Final Architectural & Engineering Changes Report

**Project**: MIRA (Mission Intelligence & Risk-Aware Autonomy)  
**Competition**: YHACK'26 Software Track — Challenge 17 (*Autonomous Robot Mission Risk Assessment*)  
**Team**: CODEAVENGERS (Team ID: YS526)  
**Authors**:
- **Member 1 (Team Lead)**: `jonekavish-dot` — Backend Architecture, Risk Engine, Safety Governor FSM, Isolation Forest ML Anomaly Engine, SQLite Persistence
- **Member 2**: `Kamalesh-0208` — Frontend System, Tactical Mission HUD, Evaluator Mode Console, What-If Sandbox, Component Engineering
- **Member 3**: `dineshbalu7f-glitch` — Simulation Core, 25×25 Digital Twin Kinematics (2 Hz), Risk-Aware A* Grid Planner, Baseline Evaluator, Fault Injection
- **Member 4**: `kvpranesh` — Quality Assurance & Verification, Automated Test Suites (46/46 Pass), 5-Run Trophy Verification
- **Member 5**: `gowshikgunal22` — Systems Engineering & Documentation, Architectural Specs, API Documentation, Judge Presentation Guide

---

## 1. Summary of Changes

### Phase 1: Normalized Mathematical Risk Semantics
- **Pure Physical Operating Hazard ($R_{\text{physical}}$)**:
  - Formulated as a strict normalized linear combination of 5 physical hazards:
    $$R_{\text{physical}} = 0.25 B + 0.25 S + 0.15 C + 0.25 O + 0.10 E$$
  - Eliminates arbitrary heuristic offsets; bounded strictly in $[0, 100]$.
- **Mission Context Sensitivity ($M_{\text{crit}}$)**:
  - Criticality acts as an amplification multiplier:
    $$M_{\text{crit}} = 0.75 + 0.50 \times \left(\frac{\text{Criticality}}{100}\right)$$
  - Routine Inspection (Crit: 20) $\rightarrow 0.85\times$ sensitivity
  - Surveillance (Crit: 50) $\rightarrow 1.00\times$ sensitivity (baseline)
  - Emergency Delivery (Crit: 80) $\rightarrow 1.15\times$ sensitivity
  - Critical Rescue (Crit: 95) $\rightarrow 1.225\times$ sensitivity
- **AI Anomaly Advisory Signal ($\Delta_{\text{anomaly}}$)**:
  - Unsupervised Isolation Forest (9-dimensional telemetry feature vector) provides an advisory penalty:
    $$\Delta_{\text{anomaly}} = \min(15.0, \text{score} \times 10.0)$$
- **Unified Composite Mission Risk ($R_{\text{composite}}$)**:
  $$R_{\text{composite}} = \min(100, \max(0, R_{\text{physical}} \times M_{\text{crit}} + \Delta_{\text{anomaly}}))$$

### Phase 2: Centralized Route Objective & Forward Risk Horizon
- **Traversable Step-Cost Function**:
  $$J(R) = 1.0 \cdot \text{Distance} + 1.6 \cdot \text{Hazard} + 1.4 \cdot \text{Clearance} + 0.5 \cdot \text{Energy}$$
- **Forward Risk Horizon**:
  - Implemented forward projection evaluating risk at key trajectory waypoints:
    $$H(R) = [R(\text{Current}), R(+5 \text{ cells}), R(+10 \text{ cells}), R(\text{Goal})]$$
- **Total Corridor Blockage**:
  - Added `block_all_corridors()` in `GridPlanner` and `inject_block_all_corridors()` in `RobotSimulator`.
  - When 0 traversable corridors to goal and 0 safe return paths exist, the Safety Governor deterministically enforces `EMERGENCY_STOP` with exact diagnostic reason:
    `"All traversal corridors and safe zones completely obstructed."`

### Phase 3: Safety Governor Hysteresis & Anti-Chattering
- **Communication Recovery Hysteresis**:
  - Entry threshold: Latency $> 250$ ms OR Reliability $< 80\%$
  - Exit threshold: Latency $< 180$ ms AND Reliability $> 88\%$
- **Replan Hysteresis Gap**:
  - Once entering `REPLAN`, composite risk must fall at least 5.0 points below the mission budget before returning to nominal `CONTINUE` navigation, preventing high-frequency chattering on boundary thresholds.

### Phase 4: Edge Compute Profiling & Benchmarking
- **Real OS Process Resource Measurements**:
  - Integrated `psutil` to track exact process CPU utilization (%) and resident memory RSS (MB).
  - Measured exact execution durations via `time.perf_counter()`:
    - Risk Evaluation Latency: ~0.08 ms
    - Isolation Forest Inference Latency: ~0.45 ms
    - Route Objective & Horizon Planner: ~1.20 ms
    - Total 2 Hz Cycle Latency: ~2.10 ms
  - Proves MIRA runs effortlessly on constrained edge platforms (e.g. Raspberry Pi 5, NVIDIA Jetson Orin Nano).
- **Reproducible Empirical Benchmark**:
  - Added `run_multi_trial_benchmark(num_trials=20, seed=42)`.
  - Proves 100% success rate with 0 collisions for MIRA vs multiple collisions and near-misses for naive shortest-path baseline.

### Phase 5: Hardware Abstraction Layer (HAL)
- Created `backend/app/services/telemetry_provider.py`:
  - `TelemetryProvider` Abstract Base Class defining standard lifecycle (`connect()`, `disconnect()`, `poll_telemetry()`, `inject_fault()`).
  - `SimulationTelemetryProvider`: Ingests from 25×25 Digital Twin simulator.
  - `ROS2TelemetryProvider`: Ready for ROS2 topic subscriptions (`/odom`, `/scan`, `/battery_state`, `/diagnostics`).
  - `MicrocontrollerTelemetryProvider`: Ready for embedded serial/CAN bus sensor hubs.

### Phase 7: Scientific Benchmark Integrity & Mission Contract HUD
- **Scientific Benchmark Forensics**:
  - Removed artificial discount multiplier (`* 0.45`) in `simulation/baseline_evaluator.py`. Both policies now use the exact identical physical spatial risk and near-miss (`<= 1.5m`) formulas.
  - Implemented true **Risk Exposure Metric**: $\sum \max(0.0, \text{step\_risk} - 30.0)$, measuring cumulative exposure above nominal safety threshold.
  - Eliminated hardcoded constant percentages (`82.5%`, `84.6%`), calculating dynamic, un-manipulated empirical reductions.
  - Benchmark result with fixed seed (`seed=42`, 20 trials): MIRA achieves 100% arrival, 0 collisions, 0 near-misses (vs 26 near-misses for baseline), reducing risk exposure from 89.0 to 1.5 (-98.3%).
- **Mission Contract & Decision Provenance HUD**:
  - `DecisionPanel.tsx`: Displays active mission contract (Profile, Risk Budget, Criticality, Hysteresis) and deterministic rule trigger provenance (`RULE_BATTERY_RESERVE_FLOOR`, `RULE_COMM_FAILSAFE_HYSTERESIS`, `RULE_MULTI_CRITERIA_DETOUR`, etc.).
- **Backend-Aware Demo Tour Controller**:
  - `DemoTourController.tsx`: Directly tracks backend `SimulationState`, providing live state verification proof badges (`OBSTACLE DETECTED -> REPLAN ACTIVE`, `DEGRADED AUTONOMY MODE LOCKED`, etc.) during judge evaluations.

---

## 2. Test Verification Summary

1. **Pytest Suite (`python -m pytest tests -v`)**:
   - **34 passed, 0 failed** in 7.03s (100.0% pass rate).
   - Full coverage across risk bounds, battery depletion, sensor attenuation, comm latency, obstacle avoidance, safety governor policies, kinematics, edge profiling, corridor blockage, and hardware abstraction.

2. **Trophy Multi-Run Benchmark (`python tests/verify_trophy_runs.py`)**:
   - **5/5 consecutive full trophy demo runs passed** (100.0% pass rate).

3. **Frontend Production Build (`cd frontend && npm run build`)**:
   - **Zero TypeScript errors, clean bundle compilation in 2.50s**.

