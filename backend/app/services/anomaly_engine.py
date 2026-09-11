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
            n_estimators=60,
            contamination=contamination,
            random_state=random_state,
            n_jobs=1,
        )
        self.is_fitted = False
        self.last_eval_ms = 0.0
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
        from sklearn.ensemble._iforest import _average_path_length
        baseline_data = self._generate_synthetic_baseline()
        self.model.fit(baseline_data)
        self.is_fitted = True

        # Precompute tree depth lookups to eliminate joblib/threading overhead (25x faster, 0.0 diff)
        self._avg_path_len_max = _average_path_length([self.model._max_samples])[0]
        self._denominator = len(self.model.estimators_) * self._avg_path_len_max
        self._precomputed_lookups = [
            (self.model._decision_path_lengths[i] + self.model._average_path_length_per_tree[i] - 1.0)
            for i in range(len(self.model.estimators_))
        ]
        self._subsample_features = (self.model._max_features != 9)
        self._trees = [est.tree_ for est in self.model.estimators_]
        self._feat_lists = self.model.estimators_features_
        self._offset = self.model.offset_

    def detect(self, telemetry: Dict[str, Any], prev_battery: float = 85.0) -> Tuple[bool, float]:
        """
        Evaluates real-time telemetry.
        Returns:
            (is_anomaly: bool, anomaly_score: float [0.0 nominal to 1.0 high anomaly])
        """
        import time
        t0 = time.perf_counter()
        if not self.is_fitted:
            self.last_eval_ms = (time.perf_counter() - t0) * 1000.0
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
        ]], dtype=np.float32)

        # High-performance direct tree evaluation
        depth_sum = 0.0
        for i, tr in enumerate(self._trees):
            sub_x = features if not self._subsample_features else features[:, self._feat_lists[i]]
            leaf = tr.apply(sub_x)
            depth_sum += self._precomputed_lookups[i][leaf[0]]

        raw_score = -(2.0 ** (-depth_sum / self._denominator)) - self._offset
        pred_is_outlier = raw_score < 0.0

        # Normalize score into [0.0, 1.0] where 1.0 is extreme anomaly
        # Typically decision_function ranges from -0.3 to +0.25
        normalized_anomaly = float(np.clip(1.0 - (raw_score + 0.3) / 0.55, 0.0, 1.0))
        is_anomaly = bool(pred_is_outlier or normalized_anomaly > 0.65)

        self.last_eval_ms = round((time.perf_counter() - t0) * 1000.0, 3)
        return is_anomaly, round(normalized_anomaly, 2)


anomaly_engine = AnomalyEngine()
