# MIRA — Mission Intelligence & Risk-Aware Autonomy

<div align="center">

```
 __  __ _____ _____            
|  \/  |_   _|  __ \   /\      
| \  / | | | | |__) | /  \     
| |\/| | | | |  _  / / /\ \    
| |  | |_| |_| | \ \/ ____ \   
|_|  |_|_____|_|  \_\_/    \_\ 
```

### Mission Intelligence & Risk-Aware Autonomy for Mission-Critical Mobile Robots
**YHACK'26 Software Track — Challenge 17: Autonomous Robot Mission Risk Assessment**  
**Team**: CODEAVENGERS &nbsp;|&nbsp; **Team ID**: YS526 &nbsp;|&nbsp; **Domain**: Software Track

[![Tests: 46/46 Passed](https://img.shields.io/badge/Tests-46%2F46%20Passed%20(100%25)-emerald?style=for-the-badge&logo=pytest)](tests/)
[![Reliability: 5/5 Trophy Runs](https://img.shields.io/badge/Reliability-5%2F5%20Trophy%20Runs-blue?style=for-the-badge)](tests/verify_trophy_runs.py)
[![Edge Compute: Jetson / RPi Ready](https://img.shields.io/badge/Edge%20Compute-Jetson%20%2F%20RPi%20Ready-purple?style=for-the-badge&logo=nvidia)](docs/ARCHITECTURE.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)](LICENSE)

> *"Traditional navigation asks where the robot should go. MIRA continuously asks whether the robot can still safely complete its mission, and what the robot should do next."*

</div>

---

## 👥 CODEAVENGERS Team & Division of Engineering Responsibilities

The MIRA codebase is architected into 5 modular, decoupled subsystems mapped directly to individual team ownership:

| Member | Role | GitHub Username | Email | Subsystem Ownership |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** | **Team Lead & Lead Architect** | [`jonekavish-dot`](https://github.com/jonekavish-dot) | `jonekavish@gmail.com` | `backend/` & Root: Multi-Factor Risk Engine, Safety Governor FSM, Isolation Forest ML Anomaly Engine, FastAPI REST/WebSocket, SQLite WAL Persistence |
| **Member 2** | **Frontend UI/UX Product Engineer** | [`Kamalesh-0208`](https://github.com/Kamalesh-0208) | `kamaleshpandi4@gmail.com` | `frontend/`: React 19 + TypeScript + Vite tactical operations HUD, SVG UGV Rover, interactive 25×25 grid, Evaluator Mode console, What-If Sandbox |
| **Member 3** | **Robotics Simulation & Planner Engineer** | [`dineshbalu7f-glitch`](https://github.com/dineshbalu7f-glitch) | `dineshbalu7.f@gmail.com` | `simulation/`: 25×25 Digital Twin Kinematics (2 Hz loop), Risk-Aware A* Multi-Criteria Planner, Baseline Comparison Evaluator, Fault Injection Engine |
| **Member 4** | **QA, Verification & Reliability Engineer** | [`kvpranesh`](https://github.com/kvpranesh) | `kvpranesh49@gmail.com` | `tests/`: 46 Automated Unit & Integration Tests (100% Pass), 5-Run Trophy Reliability Validator, Hardware Abstraction Layer testing |
| **Member 5** | **Systems Engineer & Technical Writer** | [`gowshikgunal22`](https://github.com/gowshikgunal22) | `gowshikgunal@gmail.com` | `docs/`: System Architecture Specs, REST/WebSocket API Docs, Judge Presentation Guide, Hardware Abstraction Layer Architecture |
| Member | Role | GitHub Username | Subsystem Ownership |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Team Lead & Lead Architect** | [`jonekavish-dot`](https://github.com/jonekavish-dot) | `backend/` & Root: Multi-Factor Risk Engine, Safety Governor FSM, Isolation Forest ML Anomaly Engine, FastAPI REST/WebSocket, SQLite WAL Persistence |
| **Member 2** | **Frontend UI/UX Product Engineer** | [`Kamalesh-0208`](https://github.com/Kamalesh-0208) | `frontend/`: React 19 + TypeScript + Vite tactical operations HUD, SVG UGV Rover, interactive 25×25 grid, Evaluator Mode console, What-If Sandbox |
| **Member 3** | **Robotics Simulation & Planner Engineer** | [`dineshbalu7f-glitch`](https://github.com/dineshbalu7f-glitch) | `simulation/`: 25×25 Digital Twin Kinematics (2 Hz loop), Risk-Aware A* Multi-Criteria Planner, Baseline Comparison Evaluator, Fault Injection Engine |
| **Member 4** | **QA, Verification & Reliability Engineer** | [`kvpranesh`](https://github.com/kvpranesh) | `tests/`: 46 Automated Unit & Integration Tests (100% Pass), 5-Run Trophy Reliability Validator, Hardware Abstraction Layer testing |
| **Member 5** | **Systems Engineer & Technical Writer** | [`gowshikgunal22`](https://github.com/gowshikgunal22) | `docs/`: System Architecture Specs, REST/WebSocket API Docs, Judge Presentation Guide, Hardware Abstraction Layer Architecture |

---

## 🧭 Executive Summary: Why MIRA?

Conventional autonomous robot navigation stacks (such as ROS2 Nav2) solve a purely geometric problem: *"What is the shortest collision-free geometric trajectory to reach the goal coordinates?"*

However, in real-world disaster relief, industrial security, medical delivery, and hostile outdoor operations, robots face progressive subsystem degradation:
- **Battery state-of-charge** drops while internal consumption surges across rough terrain.
- **Vision and LiDAR sensors** attenuate due to dust, smoke, condensation, or lens occlusion.
- **Wireless communications (RF/Wi-Fi/5G)** suffer latency spikes, multipath fading, or total dropouts.
- **Dynamic obstacles and toxic hazard zones** shift and obstruct narrow corridors.

When these factors compound, conventional shortest-path navigation fails catastrophically—the robot either crashes into dynamic obstacles under occluded sensing, freezes when disconnected from base control, or becomes stranded in the field without sufficient reserve battery to return.

**MIRA (Mission Intelligence & Risk-Aware Autonomy)** is an intelligent, mission-level safety governor operating **above** the trajectory planner. MIRA continuously computes a unified **0–100 Mission Risk Score**, factors in **Mission Criticality Context**, runs **unsupervised AI Anomaly Detection (Isolation Forest)**, and autonomously enforces dynamic behavioral decisions with **human-readable explainability**.

---

## ⚡ "Why No Supercomputer?" — The Edge Compute Philosophy

A common misconception in autonomous robotics is that robust risk intelligence requires multi-gigawatt cloud servers or power-hungry datacenter racks. 

**MIRA is deliberately engineered from first principles for Edge-Compute Deployment:**

```
                  TYPICAL DEPLOYMENT TARGETS
  [NVIDIA Jetson Orin Nano]    [Raspberry Pi 5]    [Intel NUC / Core i5]
       Power: 7-15 Watts          Power: 5 Watts        Power: 25 Watts
```

### Live Resource & Execution Profiling (Measured on Host Process via `psutil`)
- **Risk Engine Evaluation Latency**: `~0.08 ms` (sub-millisecond arithmetic evaluation)
- **Isolation Forest Inference Latency**: `~0.45 ms` (optimized NumPy vectorization)
- **Multi-Criteria A* Planner Latency**: `~1.20 ms` (25×25 tactical obstacle grid)
- **Total 2.0 Hz Evaluation Cycle**: `~2.10 ms` (well within the 500 ms tick budget; **< 0.5% compute headroom**)
- **Process Memory Footprint (RSS)**: `~45.8 MB`
- **Host Process CPU Utilization**: `< 1.5%`

> **Key Takeaway**: MIRA brings deterministic, real-time safety governor intelligence directly onto battery-powered unmanned ground vehicles (UGVs) without burdening payload capacity or thermal budgets.

---

## 📐 Mathematical Formulation & Risk Semantics

MIRA separates **Physical Operating Hazards** from **Mission Operational Context** and **AI Advisory Signals** to ensure sound mathematical semantics:

### 1. Pure Physical Operating Risk ($R_{\text{physical}}$)
A normalized, bounded $[0, 100]$ linear combination of 5 physical hazard components:
$$R_{\text{physical}} = 0.25 \cdot R_{\text{battery}} + 0.25 \cdot R_{\text{sensor}} + 0.15 \cdot R_{\text{comm}} + 0.25 \cdot R_{\text{obstacle}} + 0.10 \cdot R_{\text{env}}$$

Where:
- $R_{\text{battery}}$: Evaluates remaining state of charge relative to the safe-return distance floor.
- $R_{\text{sensor}}$: Perception health attenuation ($100 - \text{Health}$).
- $R_{\text{comm}}$: Weighted latency ($55\%$) and packet reliability degradation ($45\%$).
- $R_{\text{obstacle}}$: Proximity decay ($65\%$) and spatial cluster density ($35\%$) with corridor blockage penalties.
- $R_{\text{env}}$: Environmental hazard index of the occupied cell.

### 2. Mission Criticality Sensitivity Multiplier ($M_{\text{crit}}$)
The exact same physical fault profile carries different tolerances depending on mission criticality:
$$M_{\text{crit}} = 0.75 + 0.50 \times \left(\frac{\text{Criticality Score}}{100}\right)$$

| Mission Profile | Criticality | Sensitivity Multiplier | Risk Budget | Operational Stance |
| :--- | :---: | :---: | :---: | :--- |
| **Routine Inspection** | 20 | **0.85×** | 60 | High tolerance; avoids frivolous replans |
| **Perimeter Surveillance** | 50 | **1.00×** | 45 | Nominal baseline sensitivity |
| **Emergency Delivery** | 80 | **1.15×** | 35 | Strict safety envelope; proactive replanning |
| **Critical Disaster Rescue** | 95 | **1.225×** | 25 | Zero-tolerance; defensive safe return on threat |

### 3. AI Telemetry Anomaly Advisory Signal ($\Delta_{\text{anomaly}}$)
An unsupervised **Isolation Forest** trained on 1,200 nominal operation vectors evaluates the 9-dimensional telemetry frame:
$$\mathbf{x} = [\text{Battery}, \Delta\text{Battery}, \text{Rate}, \text{SensorHealth}, \text{Latency}, \text{Reliability}, \text{ObstacleDist}, \text{Speed}, \text{EnvRisk}]$$
When an anomalous multi-system pattern is identified (decision function outlier), it contributes a bounded advisory signal:
$$\Delta_{\text{anomaly}} = \min\left(15.0, \text{score} \times 10.0\right)$$

### 4. Unified Composite Mission Risk Score ($R_{\text{composite}}$)
$$R_{\text{composite}} = \min\left(100.0, \max\left(0.0, R_{\text{physical}} \times M_{\text{crit}} + \Delta_{\text{anomaly}}\right)\right)$$

### 5. Multi-Criteria Route Objective Cost Function ($J(R)$)
Instead of pure distance, candidate routes are scored across multi-objective criteria:
$$J(R) = 1.0 \cdot \text{Distance} + 1.6 \cdot \text{HazardCost} + 1.4 \cdot \text{ClearancePenalty} + 0.5 \cdot \text{EnergyCost}$$

### 6. Forward Risk Horizon ($H(R)$)
MIRA calculates projected risk across 4 forward lookahead waypoints:
$$H(R) = \left[\, R(\text{Current}), \; R(+5 \text{ cells}), \; R(+10 \text{ cells}), \; R(\text{Goal}) \,\right]$$

### 7. Hysteresis & Anti-Chattering Rules
To prevent high-frequency decision oscillation:
- **Degraded Communication Mode**: Enters when Latency $> 250$ ms or Reliability $< 80\%$; exits only when Latency $< 180$ ms and Reliability $> 88\%$.
- **Replan Hysteresis Gap**: Once entering `REPLAN`, composite risk must fall at least $5.0$ points below the profile budget before returning to nominal `CONTINUE`.

---

## 🏛️ System Architecture

```
                                  MIRA ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                               EDGE SENSOR LAYER                                 │
 │   [LiDAR / Depth Camera]   [Battery BMS]   [RF Link Monitor]   [IMU / Odom]    │
 └──────────────────────────────────────┬──────────────────────────────────────────┘
                                        │ Standardized Telemetry Frame (2 Hz)
 ┌──────────────────────────────────────▼──────────────────────────────────────────┐
 │                         HARDWARE ABSTRACTION LAYER (HAL)                        │
 │  SimulationTelemetryProvider  │  ROS2TelemetryProvider  │  MCUTelemetryProvider │
 └──────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
 ┌──────────────────────────────────────▼──────────────────────────────────────────┐
 │                               HYBRID RISK ENGINE                                │
 │   Deterministic Multi-Factor Rules (0-100)  +  Isolation Forest ML (9D Space)   │
 └──────────────────────────────────────┬──────────────────────────────────────────┘
                                        │ Composite Score & Breakdown
 ┌──────────────────────────────────────▼──────────────────────────────────────────┐
 │                                SAFETY GOVERNOR                                  │
 │   Finite State Machine: CONTINUE | SLOW_DOWN | REPLAN | DEGRADED | RETURN | STOP │
 └───────────────────┬─────────────────────────────────────────────┬───────────────┘
                     │ Commanded Action                            │ Audit Event
 ┌───────────────────▼──────────────────────┐   ┌──────────────────▼──────────────┐
 │     A* MULTI-CRITERIA ROUTE PLANNER      │   │    SQLITE WAL AUDIT LOGGING     │
 │  Corridors, Risk Horizon, Safe Zone Path │   │ Structured Black-Box Log Record │
 └───────────────────┬──────────────────────┘   └─────────────────────────────────┘
                     │ Trajectory & Speed Setpoint
 ┌───────────────────▼─────────────────────────────────────────────────────────────┐
 │                           DIGITAL TWIN & UI DASHBOARD                           │
 │   FastAPI WebSocket ──► React 19 Tactical Mission HUD ──► Evaluator Console     │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Empirical Benchmarking: MIRA vs Static Distance-Only Baseline

To provide reproducible scientific evidence, MIRA includes an automated Monte Carlo benchmark runner evaluating **20 randomized trials** with fixed pseudo-random seed (`seed=42`) under identical physical obstacle fields and sensor degradation, complemented by **8 controlled fault scenarios**:

- **Static Distance-Only Baseline**: Traditional A* shortest-path navigation on static occupancy map; unaware of dynamic obstacles, battery discharge rate, sensor degradation, comm dropouts, or toxic hazard zones.
- **Physical Operating Risk Metric**: Evaluates unified physical environmental and subsystem hazards ($R_{\text{physical}}$ = 25% battery + 25% sensor + 15% comm + 25% obstacle + 10% env) identically between both policies.

| Evaluation Metric | Static Distance-Only Baseline (A* on Static Map) | MIRA Risk-Aware Mission Governor | Delta / Improvement |
| :--- | :---: | :---: | :---: |
| **Goal Completion Rate** | 85.0% (17/20 arrivals) | **100.0% (20/20 arrivals)** | **+15.0% Goal Completion** |
| **Total Collisions** | 3 (15.0% collision rate) | **0 (0.0% collision rate)** | **100% Collision Elimination (-3)** |
| **Total Collisions** | 3 (15.0% collision rate) | **0 (0.0% collision rate)** | **0 vs 3 Collisions (-3 in tested trials)** |
| **Near-Miss Incidents (≤1.5m)** | 37 | **3** | **-91.9% Near-Miss Reduction (-34)** |
| **Mean Physical Risk** | 21.1 / 100 | **18.8 / 100** | **-10.9% Mean Risk Reduction (-2.3 pts)** |
| **Physical Risk Exposure (>30)** | 25.5 pts | **2.2 pts** | **-91.4% Risk Exposure Reduction** |
| **Mean Path Length** | 28.6 m | **31.5 m** | +10.1% (Safe bypass detour) |
| **Mean Energy Consumed** | 28.6% | **28.7%** | +0.3% delta |
| **Safety Governor Mode Shifts** | 0 (blind forward drive) | Dynamic (REPLAN / SLOW_DOWN / RETURN) | Context-Aware Adaptation |

*Benchmark command*: `POST /benchmark/run?trials=20&seed=42` (also executable in 1-click on the "Baseline vs MIRA" tab). Both 20 randomized trials and 8 controlled scenarios run in isolated digital twin sandboxes with zero live state mutation.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- **Python**: 3.10+ (Tested on Python 3.14)
- **Node.js**: 18+ (Tested on Node.js 24)
- **Git**

### Step 1: Clone the Repository
```powershell
git clone https://github.com/jonekavish-dot/YHACK26_YS256_CODEAVENGERS.git
cd YHACK26_YS256_CODEAVENGERS
```

### Step 2: Set Up & Launch Backend Server
```powershell
# Install Python dependencies
pip install fastapi uvicorn pydantic scikit-learn numpy pandas networkx psutil pytest pytest-asyncio httpx

# Start high-performance Uvicorn server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- REST API Live: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- 2 Hz WebSocket Stream: `ws://127.0.0.1:8000/ws`

### Step 3: Launch Frontend Tactical Dashboard
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 🎯 Evaluator Guide & Interactive Demo Tour

### Mode 1: Automated Backend-Aware 85-Second Demo Tour (Recommended for Judges)
Click **`Start Live Demo`** on the top banner. MIRA's controller is **backend-synchronized**—each phase verifies live physical state telemetry acknowledgment before advancing:
1. **Nominal Trajectory**: Robot R01 departs Depot at 1.0 m/s with optimal Green risk profile.
2. **Dynamic Obstacle**: Sudden barrier drops on path; Governor commands autonomous `REPLAN` via an alternate corridor (`OBSTACLE DETECTED -> REPLAN ACTIVE`).
3. **Battery Drain**: Energy drops to 48%; Governor tightens energy budget and monitors safe return reserve floor.
4. **Sensor Degradation**: Perception health drops to 48%; Governor commands `SLOW_DOWN` to widen the perception stopping distance window.
5. **Communication Loss**: Latency spikes to 480ms; Governor transitions to `DEGRADED_AUTONOMY` onboard fail-safe mode.
6. **Compound Critical Fault**: Battery breaches reserve floor; Governor commands `RETURN_TO_SAFE_ZONE` to prevent stranding.
7. **System Recovery**: Nominal health restored; mission resumes toward Medical Camp destination.

### Mode 2: Interactive Evaluator Console, Mission Contract & Decision Provenance
1. **Mission Contract & Provenance HUD**: The Governor decision panel displays the active mission contract (Risk Budget, Criticality, and 5.0 pt Hysteresis) alongside the deterministic rule trigger (`RULE_BATTERY_RESERVE_FLOOR`, `RULE_COMM_FAILSAFE_HYSTERESIS`, etc.) explaining exact mathematical causality.
2. **Evaluator Mode**: Toggle `EVALUATOR MODE` in the header to inspect raw risk weight math, live process CPU/RAM, sub-millisecond latencies, and active FSM state.
3. **What-If Sandbox & Cross-Profile Sensitivity**: Adjust telemetry sliders to observe the **Cross-Profile Sensitivity Matrix** showing how Routine Inspection, Surveillance, Emergency Delivery, and Critical Rescue respond differently to identical telemetry.
4. **Reproducible Benchmark**: Switch to the **Baseline vs MIRA** tab and click `RUN BENCHMARK (20 TRIALS, SEED=42)` to verify empirical collision and risk exposure reduction.
5. **Fail-Safe Corridor Blocking**: Click `BLOCK ALL CORRIDORS (EMERGENCY STOP)` in Event Controls to observe MIRA's immediate fail-safe halting overlay and safe brake engagement.

---

## 🧪 Comprehensive Quality Assurance (46/46 Tests Passing)

All tests run locally in under 25 seconds with zero external mocks or network dependencies:

```powershell
# Run full automated test suite
python -m pytest tests -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-9.1.1, pluggy-1.6.0
collected 46 items

tests/test_integration_pipeline.py::test_api_fresh_startup_health PASSED [  2%]
tests/test_integration_pipeline.py::test_api_robots_and_missions PASSED  [  4%]
tests/test_integration_pipeline.py::test_deterministic_risk_vectors PASSED [  6%]
tests/test_integration_pipeline.py::test_risk_engine_extreme_edge_cases PASSED [  8%]
tests/test_integration_pipeline.py::test_mission_context_governor_differentiation PASSED [ 10%]
tests/test_integration_pipeline.py::test_safety_governor_all_six_states PASSED [ 13%]
tests/test_integration_pipeline.py::test_risk_aware_route_tradeoff PASSED [ 15%]
tests/test_integration_pipeline.py::test_no_safe_route_graceful_handling PASSED [ 17%]
tests/test_integration_pipeline.py::test_rapid_event_stress_and_recovery PASSED [ 19%]
tests/test_integration_pipeline.py::test_database_persistence PASSED     [ 21%]
tests/test_planner.py::test_a_star_finds_valid_path PASSED               [ 23%]
tests/test_planner.py::test_dynamic_obstacle_blocks_and_forces_detour PASSED [ 26%]
tests/test_planner.py::test_risk_aware_route_scoring_prefers_safer_corridor PASSED [ 28%]
tests/test_risk_engine.py::test_risk_score_bounds PASSED                 [ 30%]
tests/test_risk_engine.py::test_battery_depletion_escalates_risk PASSED  [ 32%]
tests/test_risk_engine.py::test_sensor_degradation_increases_risk PASSED [ 34%]
tests/test_risk_engine.py::test_communication_degradation_escalates_risk PASSED [ 36%]
tests/test_risk_engine.py::test_obstacle_proximity_escalates_risk PASSED [ 39%]
tests/test_risk_engine.py::test_mission_criticality_influences_risk PASSED [ 41%]
tests/test_safety_governor.py::test_safety_governor_nominal_continue PASSED [ 43%]
tests/test_safety_governor.py::test_safety_governor_degraded_autonomy PASSED [ 45%]
tests/test_safety_governor.py::test_safety_governor_obstacle_triggers_replan_not_estop PASSED [ 47%]
tests/test_safety_governor.py::test_safety_governor_critical_battery_returns_to_safe_zone PASSED [ 50%]
tests/test_simulator.py::test_simulator_initialization_and_tick PASSED   [ 52%]
tests/test_simulator.py::test_simulator_dynamic_obstacle_injection PASSED [ 54%]
tests/test_simulator.py::test_simulator_battery_drain_and_safe_return PASSED [ 56%]
tests/test_simulator.py::test_simulator_sensor_degradation_slows_speed PASSED [ 58%]
tests/test_simulator.py::test_simulator_communication_degradation_triggers_degraded_autonomy PASSED [ 60%]
tests/test_simulator.py::test_simulator_recovery PASSED                  [ 63%]
tests/test_trophy_features.py::test_edge_compute_profiling_live PASSED   [ 65%]
tests/test_trophy_features.py::test_block_all_corridors_emergency_stop PASSED [ 67%]
tests/test_trophy_features.py::test_reproducible_benchmark_execution PASSED [ 69%]
tests/test_trophy_features.py::test_sandbox_compare_profiles_api PASSED  [ 71%]
tests/test_hardware_abstraction_providers PASSED [ 73%]
tests/test_trophy_features.py::test_benchmark_fixed_seed_reproducibility PASSED [ 76%]
tests/test_trophy_features.py::test_benchmark_different_seeds_produce_different_metrics PASSED [ 78%]
tests/test_trophy_features.py::test_identical_scenario_pair_invariance PASSED [ 80%]
tests/test_trophy_features.py::test_benchmark_battery_reserve_pressure_aborts_to_safe_zone PASSED [ 82%]
tests/test_trophy_features.py::test_benchmark_block_all_corridors_estop PASSED [ 84%]
tests/test_trophy_features.py::test_benchmark_sensor_degradation_slows_speed PASSED [ 86%]
tests/test_trophy_features.py::test_benchmark_comm_degradation_triggers_degraded_autonomy PASSED [ 89%]
tests/test_trophy_features.py::test_benchmark_api_constraints_validation PASSED [ 91%]
tests/test_trophy_features.py::test_benchmark_does_not_mutate_live_simulator_state PASSED [ 93%]
tests/test_trophy_features.py::test_trial_result_tracks_true_min_sensor_and_max_comm_extremes PASSED [ 95%]
tests/test_trophy_features.py::test_success_semantics_strict_goal_arrival PASSED [ 97%]
tests/test_trophy_features.py::test_planner_cost_functions_and_objective_distinction PASSED [100%]

======================= 46 passed, 1 warning in 24.82s =======================
```

### Full Trophy Multi-Run Validation
```powershell
python tests/verify_trophy_runs.py
```
```
=================================================================
STARTING 5 CONSECUTIVE FULL TROPHY DEMO RUNS
=================================================================
Run 1/5: SUCCESS | Replan: True | Degraded: True | Return: True | Recovery: True
Run 2/5: SUCCESS | Replan: True | Degraded: True | Return: True | Recovery: True
Run 3/5: SUCCESS | Replan: True | Degraded: True | Return: True | Recovery: True
Run 4/5: SUCCESS | Replan: True | Degraded: True | Return: True | Recovery: True
Run 5/5: SUCCESS | Replan: True | Degraded: True | Return: True | Recovery: True
=================================================================
FINAL RESULT: 5/5 SUCCESSFUL RUNS (100.0% RELIABILITY)
=================================================================
```

---

## 📁 Repository Directory Structure

```
d:/Y-HACK 26/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py                 # REST Endpoints (what-if, benchmark, events)
│   │   │   └── websocket.py              # 2 Hz Real-Time Telemetry Stream
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── database.py               # SQLite WAL Black-Box Audit Logger
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── types.py                  # Pydantic Schemas & ComputeMetrics
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── anomaly_engine.py         # Isolation Forest Unsupervised Anomaly Model
│   │   │   ├── explanation_engine.py     # Natural Language Tradeoff Generator
│   │   │   ├── risk_engine.py            # Normalized Multi-Factor Risk Calculator
│   │   │   ├── safety_governor.py        # 6-State FSM with Hysteresis & Anti-Chattering
│   │   │   └── telemetry_provider.py     # Hardware Abstraction Layer (HAL)
│   │   ├── config.py                     # Coordinates, Hazard Zones, Mission Profiles
│   │   └── main.py                       # FastAPI Application Factory & Middleware
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArchitectureVisualizer.tsx# 7-Stage Pipeline Visualizer
│   │   │   ├── BaselineComparison.tsx    # 20-Trial Monte Carlo Benchmark Runner
│   │   │   ├── DecisionLog.tsx           # Audit Trail Table
│   │   │   ├── DecisionPanel.tsx         # Route Objective & Risk Horizon Display
│   │   │   ├── DemoTourController.tsx    # Automated 85s Scripted Demo Tour
│   │   │   ├── EvaluatorMode.tsx         # Evaluator Diagnostic Console & Edge Profiler
│   │   │   ├── EventControlPanel.tsx     # Fault Injector (Obstacle, Drain, Block)
│   │   │   ├── Header.tsx                # MIRA Hover Animation & Live CPU/RAM Badge
│   │   │   ├── MissionMap.tsx            # 25x25 Metric Grid & Animated SVG UGV Rover
│   │   │   ├── RiskBreakdown.tsx         # 5 Physical Factors, Context, & AI Advisory
│   │   │   ├── RiskGauge.tsx             # Radial Semi-Circle Composite Gauge
│   │   │   ├── RiskTimeline.tsx          # Real-Time Risk History Chart
│   │   │   ├── TelemetryPanel.tsx        # Telemetry State Gauges
│   │   │   └── WhatIfSimulator.tsx       # Sliders & Cross-Profile Sensitivity Matrix
│   │   ├── services/
│   │   │   ├── api.ts                    # REST API Client Methods
│   │   │   └── websocket.ts              # Resilient WebSocket Client
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript Interface Definitions
│   │   ├── App.tsx                       # Main Application State & Layout
│   │   └── main.tsx                      # Vite Application Entrypoint
├── simulation/
│   ├── __init__.py
│   ├── baseline_evaluator.py             # Reproducible Monte Carlo Benchmark Runner
│   ├── planner.py                        # Risk-Aware A* Grid Planner & Corridor Engine
│   └── simulator.py                      # 25x25 Digital Twin Kinematics & psutil Profiler
├── tests/
│   ├── test_integration_pipeline.py     # 10 End-to-End Pipeline Integration Tests
│   ├── test_planner.py                  # 3 A* Grid Planning & Detour Tests
│   ├── test_risk_engine.py              # 6 Multi-Factor Risk Unit Tests
│   ├── test_safety_governor.py          # 4 Safety Governor Decision Policy Tests
│   ├── test_simulator.py                # 6 Digital Twin Kinematics & Fault Tests
│   ├── test_trophy_features.py          # 17 Evaluator-Grade Edge, Telemetry & Benchmark Tests
│   └── verify_trophy_runs.py            # 5-Cycle Consecutive Trophy Demo Validator
├── docs/
│   ├── API_SPEC.md                      # Complete OpenAPI / WebSocket Documentation
│   ├── ARCHITECTURE.md                  # Deep Technical Architecture & State Diagrams
│   ├── DEMO_SCRIPT.md                   # 5-Minute Evaluator Presentation Script
│   └── FINAL_CHANGES.md                 # Complete Chronological Engineering Log
├── AUDIT_REPORT.md                      # Safety & Decision Audit Log Specification
├── FINAL_ENGINEERING_AUDIT.md           # 28-Phase Forensic System Audit & Verification Report
├── FINAL_QA_REPORT.md                   # Full Quality Assurance Certification
└── README.md                            # Primary Documentation & Project Guide
```

---

<div align="center">

**MIRA — Built with Pride by CODEAVENGERS for YHACK'26**  
*Lead Architect: jonekavish-dot &nbsp;|&nbsp; Team ID: YS526*

</div>
