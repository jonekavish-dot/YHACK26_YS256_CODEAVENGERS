# MIRA REST API & WebSocket Protocol Specification

## Base URL
- **REST Endpoints:** `http://localhost:8000/api` (or `http://localhost:8000`)
- **WebSocket Stream:** `ws://localhost:8000/ws`
- **Swagger Documentation:** `http://localhost:8000/docs`

---

## REST Endpoints

### 1. System & Mission Status
- **`GET /health`**: Returns system health, service name, and simulator status.
- **`GET /robots`**: Returns active robot metadata (ID, model, coordinates, battery).
- **`GET /missions`**: Lists available mission profiles and current active mission ID.
- **`GET /mission/{id}`**: Returns full simulation snapshot (telemetry, risk, routes, decision).
- **`GET /robot/{id}/state`**: Telemetry and position of specified robot.
- **`GET /risk/{mission_id}`**: Normalized factor breakdown and composite risk index.
- **`GET /routes/{mission_id}`**: Active trajectory and candidate alternative corridors.
- **`GET /metrics/{mission_id}`**: Cumulative distance, energy consumed, replanning count, and baseline comparison.
- **`GET /audit-logs/{mission_id}`**: Recent chronological decision and fault event records.

### 2. Mission Execution Controls
- **`POST /mission/start?profile={profile_key}`**: Initializes and starts mission run.
- **`POST /mission/pause`**: Pauses simulation tick loop.
- **`POST /mission/resume`**: Resumes simulation tick loop.
- **`POST /mission/reset?profile={profile_key}`**: Resets robot to Depot (2, 2) with nominal initial conditions.
- **`POST /mission/speed?speed={1.0|2.0|4.0}`**: Sets simulation clock acceleration multiplier.

### 3. Fault & Event Injections
- **`POST /events/obstacle`**: Spawns dynamic obstacle on upcoming path or specified coordinate.
- **`POST /events/battery-drain`**: Injects accelerated power drain (e.g. drop to 28%).
- **`POST /events/sensor-degradation`**: Injects camera/lidar attenuation (e.g. drop to 48%).
- **`POST /events/communication-degradation`**: Injects link latency and jitter (e.g. 480ms, 68% reliability).
- **`POST /events/environment-risk`**: Overrides local hazard index (e.g. 85%).
- **`POST /events/combined-fault`**: Triggers compound cascading failure.
- **`POST /events/recover`**: Restores all subsystems to 100% nominal operational parameters.

### 4. What-If Sandbox
- **`POST /what-if`**:
  - Request payload: `{ battery, sensor_health, communication_latency, obstacle_density, environment_risk, mission_profile }`
  - Response payload: `{ composite_risk, risk_level, breakdown, recommended_action, operating_mode, explanation, tradeoff_advice }`

---

## WebSocket Telemetry Protocol (`ws://localhost:8000/ws`)
Broadcast frequency: **2 Hz** (every 500ms scaled by simulation speed).
Payload schema: Full `SimulationState` JSON containing `telemetry`, `risk`, `decision`, `current_route`, `candidate_routes`, `dynamic_obstacles`, and `metrics`.

