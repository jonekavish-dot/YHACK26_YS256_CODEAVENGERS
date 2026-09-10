"""
MIRA AI Anomaly Engine - Isolation Forest on Robot Telemetry
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, Tuple


class AnomalyEngine:
    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_state,
        )
        self.is_fitted = False
        self._fit_baseline()

    def _generate_synthetic_baseline(self, n_samples: int = 1200) -> np.ndarray:
        """Generates synthetic nominal telemetry for healthy autonomous operations."""
        np.random.seed(42)
        # Features: [battery, battery_delta, consumption_rate, sensor_health, latency, reliability, obstacle_dist, speed, env_risk]
        battery = np.random.uniform(70.0, 98.0, n_samples)
        battery_delta = np.random.uniform(-0.35, -0.05, n_samples)
        consumption_rate = np.random.uniform(0.8, 1.4, n_samples)
        sensor_health = np.random.uniform(90.0, 100.0, n_samples)
        latency = np.random.uniform(25.0, 85.0, n_samples)
        reliability = np.random.uniform(94.0, 100.0, n_samples)
        obstacle_dist = np.random.uniform(4.0, 14.0, n_samples)
        speed = np.random.uniform(0.8, 1.2, n_samples)
        env_risk = np.random.uniform(5.0, 28.0, n_samples)

        return np.column_stack([
            battery,
            battery_delta,
            consumption_rate,
            sensor_health,
            latency,
            reliability,
            obstacle_dist,
            speed,
            env_risk,
        ])

    def _fit_baseline(self):
        """Fit Isolation Forest on nominal operational baseline."""
        baseline_data = self._generate_synthetic_baseline()
        self.model.fit(baseline_data)
        self.is_fitted = True

    def detect(self, telemetry: Dict[str, Any], prev_battery: float = 85.0) -> Tuple[bool, float]:
        """
        Evaluates real-time telemetry.
        Returns:
            (is_anomaly: bool, anomaly_score: float [0.0 nominal to 1.0 high anomaly])
        """
        if not self.is_fitted:
            return False, 0.0

        current_battery = float(telemetry.get("battery", 85.0))
        battery_delta = current_battery - prev_battery

        features = np.array([[
            current_battery,
            battery_delta,
            float(telemetry.get("energy_consumption_rate", 1.2)),
            float(telemetry.get("sensor_health", 95.0)),
            float(telemetry.get("communication_latency", 45.0)),
            float(telemetry.get("communication_reliability", 98.0)),
            float(telemetry.get("obstacle_distance", 8.0)),
            float(telemetry.get("speed", 1.0)),
            float(telemetry.get("environment_risk", 15.0)),
        ]])

        pred = self.model.predict(features)[0]  # 1 for inlier, -1 for outlier
        raw_score = self.model.decision_function(features)[0]  # higher is more normal

        # Normalize score into [0.0, 1.0] where 1.0 is extreme anomaly
        # Typically decision_function ranges from -0.3 to +0.25
        normalized_anomaly = float(np.clip(1.0 - (raw_score + 0.3) / 0.55, 0.0, 1.0))
        is_anomaly = bool(pred == -1 or normalized_anomaly > 0.65)

        return is_anomaly, round(normalized_anomaly, 2)


anomaly_engine = AnomalyEngine()
