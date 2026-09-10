import React, { useState } from 'react';
import { SimulationState } from '../types';
import { Navigation, Crosshair, Sparkles, AlertOctagon } from 'lucide-react';
import { injectObstacle } from '../services/api';

interface MissionMapProps {
  state: SimulationState | null;
}

export const MissionMap: React.FC<MissionMapProps> = ({ state }) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const width = 25;
  const height = 25;
  const cellSize = 23;
  const mapPixelWidth = width * cellSize;
  const mapPixelHeight = height * cellSize;

  const robotX = state?.x ?? 2;
  const robotY = state?.y ?? 2;
  const staticObstacles = state?.static_obstacles ?? [];
  const dynamicObstacles = state?.dynamic_obstacles ?? [];
  const activeRoutePoints = state?.current_route ?? [];
  const candidateRoutes = state?.candidate_routes ?? [];
  const depot = state?.depot ?? [2, 2];
  const goal = state?.medical_camp ?? [22, 22];
  const safeZone = state?.safe_zone ?? [4, 14];

  // Calculate robot heading angle towards next waypoint
  let headingAngle = 0;
  if (activeRoutePoints.length > 1) {
    // Find robot's current index in active route
    const currentIdx = activeRoutePoints.findIndex(([px, py]) => px === robotX && py === robotY);
    if (currentIdx !== -1 && currentIdx < activeRoutePoints.length - 1) {
      const [nx, ny] = activeRoutePoints[currentIdx + 1];
      headingAngle = (Math.atan2(ny - robotY, nx - robotX) * 180) / Math.PI;
    } else if (activeRoutePoints.length > 1) {
      const [nx, ny] = activeRoutePoints[1];
      headingAngle = (Math.atan2(ny - robotY, nx - robotX) * 180) / Math.PI;
    }
  }

  // Hazard zones with cyber-tactical styling
  const hazardZones = [
    { x1: 11, y1: 1, x2: 15, y2: 7, label: 'ZONE A: CHEMICAL LEAK', color: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444', borderDash: '4 3' },
    { x1: 5, y1: 16, x2: 9, y2: 22, label: 'ZONE B: UNSTABLE DEBRIS', color: 'rgba(245, 158, 11, 0.15)', stroke: '#f59e0b', borderDash: '4 3' },
    { x1: 18, y1: 8, x2: 23, y2: 13, label: 'ZONE C: HIGH EMI / BLACKOUT', color: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7', borderDash: '4 3' },
  ];

  const handleCellClick = (x: number, y: number) => {
    injectObstacle(x, y);
  };

  const toSvgPoints = (points: [number, number][]) => {
    return points
      .map(([px, py]) => `${px * cellSize + cellSize / 2},${py * cellSize + cellSize / 2}`)
      .join(' ');
  };

  const robotMode = state?.decision.mode ?? 'NORMAL';
  const robotAction = state?.decision.action ?? 'CONTINUE';

  // Robot color scheme based on operating mode
  const robotColor = {
    NORMAL: '#38bdf8',
    DEGRADED_AUTONOMY: '#f59e0b',
    SAFE_RETURN: '#a855f7',
    EMERGENCY_STOP: '#ef4444',
  }[robotMode] || '#38bdf8';

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col items-center">
      {/* Map Header Bar */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2 font-mono">
            TACTICAL MISSION GRID
            <span className="text-[10px] text-slate-400 font-sans font-normal">
              (25×25 Metric Cells • Click cell to place dynamic hazard)
            </span>
          </h3>
        </div>
        {hoveredCell ? (
          <div className="text-xs font-mono text-sky-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5">
            <Crosshair className="h-3 w-3 text-sky-400" />
            <span>X: {hoveredCell.x} Y: {hoveredCell.y}</span>
          </div>
        ) : (
          <div className="text-xs font-mono text-slate-500">
            Grid Scale: 1 cell = 1.0 m²
          </div>
        )}
      </div>

      {/* SVG Canvas Map Container */}
      <div className="relative overflow-auto max-w-full p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
        <svg
          width={mapPixelWidth}
          height={mapPixelHeight}
          className="select-none"
          style={{ minWidth: `${mapPixelWidth}px`, minHeight: `${mapPixelHeight}px` }}
        >
          {/* Subtle Grid Pattern */}
          <defs>
            <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <path
                d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.035)"
                strokeWidth="1"
              />
            </pattern>
            {/* Front Headlight Illumination Beam Gradient */}
            <radialGradient id="headlightBeam" cx="0%" cy="50%" r="90%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width={mapPixelWidth} height={mapPixelHeight} fill="#060912" />
          <rect width={mapPixelWidth} height={mapPixelHeight} fill="url(#grid)" />

          {/* Hazard Zones with Danger Cross-Hatch */}
          {hazardZones.map((z, idx) => (
            <g key={idx}>
              <rect
                x={z.x1 * cellSize}
                y={z.y1 * cellSize}
                width={(z.x2 - z.x1 + 1) * cellSize}
                height={(z.y2 - z.y1 + 1) * cellSize}
                fill={z.color}
                stroke={z.stroke}
                strokeWidth="1.2"
                strokeDasharray={z.borderDash}
                rx="4"
              />
              <text
                x={z.x1 * cellSize + 6}
                y={z.y1 * cellSize + 14}
                fill={z.stroke}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.9"
              >
                {z.label}
              </text>
            </g>
          ))}

          {/* Static Obstacles (Reinforced Facility Walls) */}
          {staticObstacles.map(([ox, oy], idx) => (
            <g key={`static-${idx}`}>
              <rect
                x={ox * cellSize + 1}
                y={oy * cellSize + 1}
                width={cellSize - 2}
                height={cellSize - 2}
                fill="#182234"
                stroke="#334155"
                strokeWidth="1"
                rx="3"
              />
              <line
                x1={ox * cellSize + 3}
                y1={oy * cellSize + 3}
                x2={(ox + 1) * cellSize - 5}
                y2={(oy + 1) * cellSize - 5}
                stroke="#0f172a"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Alternative Candidate Routes (Dashed Lines) */}
          {candidateRoutes.map((route) => {
            if (route.points.length < 2) return null;
            return (
              <polyline
                key={route.id}
                points={toSvgPoints(route.points)}
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.4"
              />
            );
          })}

          {/* Active Planned Route with Outer Glow & Waypoints */}
          {activeRoutePoints.length > 1 && (
            <>
              <polyline
                points={toSvgPoints(activeRoutePoints)}
                fill="none"
                stroke={robotColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.2"
              />
              <polyline
                points={toSvgPoints(activeRoutePoints)}
                fill="none"
                stroke={robotColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={robotAction === 'SLOW_DOWN' ? '6 4' : undefined}
              />
              {/* Waypoint Dots */}
              {activeRoutePoints.map(([wx, wy], widx) => {
                if (widx % 3 !== 0) return null;
                return (
                  <circle
                    key={`wp-${widx}`}
                    cx={wx * cellSize + cellSize / 2}
                    cy={wy * cellSize + cellSize / 2}
                    r="2"
                    fill={robotColor}
                    opacity="0.6"
                  />
                );
              })}
            </>
          )}

          {/* Start Point (Depot Facility) */}
          <g transform={`translate(${depot[0] * cellSize + cellSize / 2}, ${depot[1] * cellSize + cellSize / 2})`}>
            <circle r="12" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.5" />
            <circle r="5" fill="#38bdf8" />
            <text x="14" y="4" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              DEPOT
            </text>
          </g>

          {/* Destination Point (Medical Camp Goal) */}
          <g transform={`translate(${goal[0] * cellSize + cellSize / 2}, ${goal[1] * cellSize + cellSize / 2})`}>
            <circle r="13" fill="#059669" fillOpacity="0.25" stroke="#10b981" strokeWidth="1.5" />
            <circle r="5" fill="#10b981" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#ffffff" strokeWidth="1.5" />
            <text x="-76" y="4" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">
              MEDICAL CAMP
            </text>
          </g>

          {/* Safe Recovery Zone */}
          <g transform={`translate(${safeZone[0] * cellSize + cellSize / 2}, ${safeZone[1] * cellSize + cellSize / 2})`}>
            <rect x="-10" y="-10" width="20" height="20" fill="#7c3aed" fillOpacity="0.25" stroke="#a855f7" strokeWidth="1.5" rx="4" />
            <circle r="4" fill="#c084fc" />
            <text x="14" y="4" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
              SAFE ZONE
            </text>
          </g>

          {/* Dynamic Obstacles (Pulsing Detection Shockwave) */}
          {dynamicObstacles.map(([dx, dy], idx) => (
            <g
              key={`dynamic-${idx}`}
              transform={`translate(${dx * cellSize + cellSize / 2}, ${dy * cellSize + cellSize / 2})`}
            >
              {/* Outer Shockwave Ring */}
              <circle r="13" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
                <animate attributeName="r" values="8;16" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
              </circle>
              {/* Core Obstacle Diamond */}
              <polygon points="0,-8 8,0 0,8 -8,0" fill="#dc2626" stroke="#fca5a5" strokeWidth="1" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          ))}

          {/* AUTONOMOUS ROBOT ROVER VISUAL (Realistic UGV Model) */}
          <g
            transform={`translate(${robotX * cellSize + cellSize / 2}, ${robotY * cellSize + cellSize / 2})`}
            className="transition-transform duration-300 ease-linear"
          >
            {/* Lidar 360-Degree Continuous Scanning Radar Beam */}
            <circle
              r="22"
              fill="none"
              stroke={robotColor}
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Directional Heading Group */}
            <g transform={`rotate(${headingAngle})`}>
              {/* Front Illumination Cone (Headlights) */}
              <polygon
                points="8,-6 24,-14 24,14 8,6"
                fill="url(#headlightBeam)"
                opacity="0.8"
              />

              {/* Left & Right All-Terrain Tread Tracks */}
              <rect x="-9" y="-8.5" width="18" height="3.5" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
              <rect x="-9" y="5" width="18" height="3.5" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />

              {/* Tread Track Ribs (Animated Motion) */}
              <line x1="-5" y1="-8.5" x2="-5" y2="-5" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="-8.5" x2="0" y2="-5" stroke="#64748b" strokeWidth="0.8" />
              <line x1="5" y1="-8.5" x2="5" y2="-5" stroke="#64748b" strokeWidth="0.8" />

              <line x1="-5" y1="5" x2="-5" y2="8.5" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="5" x2="0" y2="8.5" stroke="#64748b" strokeWidth="0.8" />
              <line x1="5" y1="5" x2="5" y2="8.5" stroke="#64748b" strokeWidth="0.8" />

              {/* Heavy Reinforced Armored Chassis */}
              <rect x="-7" y="-5.5" width="14" height="11" rx="2" fill="#1e293b" stroke={robotColor} strokeWidth="1.2" />

              {/* Lidar Turret Dome */}
              <circle cx="0" cy="0" r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.2" fill="#ffffff" />

              {/* Front Dual LED Spotlights */}
              <circle cx="7" cy="-3.5" r="1.2" fill="#ffffff" />
              <circle cx="7" cy="3.5" r="1.2" fill="#ffffff" />
            </g>

            {/* Robot Identification HUD Tag */}
            <rect x="-14" y="-19" width="28" height="9" rx="2" fill="#090d16" stroke={robotColor} strokeWidth="0.8" />
            <text x="0" y="-12.5" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              R01 UGV
            </text>
          </g>

          {/* Clickable Transparent Grid Layer for Interactive Obstacle Drops */}
          {Array.from({ length: width }).map((_, x) =>
            Array.from({ length: height }).map((_, y) => (
              <rect
                key={`click-${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill="transparent"
                className="cursor-crosshair hover:fill-sky-500/10"
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
              />
            ))
          )}
        </svg>

        {/* Emergency Stop / No Safe Route HUD Overlay */}
        {robotAction === 'EMERGENCY_STOP' && (
          <div className="absolute inset-x-8 top-1/3 p-4 rounded-xl bg-rose-950/90 border-2 border-rose-500/80 backdrop-blur-md shadow-2xl flex items-center space-x-3 text-white pointer-events-none animate-pulse">
            <div className="p-2.5 rounded-lg bg-rose-600 shrink-0">
              <AlertOctagon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-rose-300">
                CRITICAL SAFETY GOVERNOR ACTION
              </div>
              <div className="text-sm font-black font-mono tracking-wide text-white">
                NO SAFE ROUTE DETECTED — EMERGENCY HALT ENGAGED
              </div>
              <div className="text-xs text-rose-200 mt-0.5 font-sans leading-tight">
                {state?.decision.reason}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Legend & Status Footer */}
      <div className="w-full flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400 font-mono mt-3 px-1">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
            <span>R01 Rover</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Goal (Camp)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" />
            <span>Safe Zone</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" />
            <span>Solid Wall</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Dynamic Hazard</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-4 h-0.5 bg-sky-400" />
            <span>Active Corridor</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-4 h-0.5 border-b border-dashed border-slate-500" />
            <span>Candidate Alternatives</span>
          </div>
        </div>
      </div>
    </div>
  );
};
