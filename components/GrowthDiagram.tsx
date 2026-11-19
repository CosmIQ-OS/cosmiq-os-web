"use client";

import RotatingCube from "@/components/RotatingCube";

export default function GrowthDiagram() {
  return (
    <div
      className="growth-diagram"
      role="img"
      aria-label="Visual diagram: AI Agent plus Your Business equals Fast Growth"
    >
      {/* Node 1: AI Agent (3D Rotating C·Q·I Cube) */}
      <div className="growth-node">
        <div className="growth-icon-stage">
          <RotatingCube className="growth-cube-svg" size={116} speed={0.5} />
        </div>
        <span className="growth-node-title">AI Agent</span>
        <span className="growth-node-sub">24/7 safe automation</span>
      </div>

      {/* Operator: + */}
      <div className="growth-op" aria-hidden="true">
        <svg viewBox="0 0 28 28" width="24" height="24">
          <path d="M14 5v18M5 14h18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
        </svg>
      </div>

      {/* Node 2: Your Business (30° Isometric Business & Team Hub) */}
      <div className="growth-node">
        <div className="growth-icon-stage">
          <svg className="growth-iso-svg" viewBox="0 0 200 200" width="116" height="116" aria-hidden="true">
            {/* Base Isometric Platform */}
            <polygon points="100,124 166,152 100,180 34,152" fill="currentColor" fillOpacity="0.14" />
            {/* Main Isometric Business Tower — Top Roof */}
            <polygon points="100,34 152,64 100,94 48,64" fill="currentColor" />
            {/* Main Isometric Business Tower — Left Lit Face */}
            <polygon points="48,64 100,94 100,164 48,134" fill="currentColor" fillOpacity="0.86" />
            {/* Main Isometric Business Tower — Right Shaded Face */}
            <polygon points="100,94 152,64 152,134 100,164" fill="currentColor" fillOpacity="0.64" />
            {/* Architectural Window Grid on Left Face (Your Team & Systems) */}
            <polygon points="60,82 88,98 88,110 60,94" fill="var(--bg-canvas)" />
            <polygon points="60,104 88,120 88,132 60,116" fill="var(--bg-canvas)" />
            {/* Architectural Window Grid on Right Face */}
            <polygon points="112,98 140,82 140,94 112,110" fill="var(--bg-canvas)" />
            <polygon points="112,120 140,104 140,116 112,132" fill="var(--bg-canvas)" />
            {/* Active Core Signal Beacon on Roof */}
            <polygon points="100,52 116,61 100,70 84,61" fill="var(--accent-primary)" />
          </svg>
        </div>
        <span className="growth-node-title">Your Business</span>
        <span className="growth-node-sub">Your team &amp; tools</span>
      </div>

      {/* Operator: = */}
      <div className="growth-op growth-op-eq" aria-hidden="true">
        <svg viewBox="0 0 28 28" width="24" height="24">
          <path d="M5 10.5h18M5 17.5h18" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="square" />
        </svg>
      </div>

      {/* Node 3: Fast Growth (30° Isometric Ascending Columns + Signal Orange Growth Vector) */}
      <div className="growth-node growth-node-result">
        <div className="growth-icon-stage">
          <svg className="growth-iso-svg" viewBox="0 0 200 200" width="116" height="116" aria-hidden="true">
            {/* Column 1 (Short — Left) */}
            <polygon points="48,116 70,103 92,116 70,129" fill="currentColor" fillOpacity="0.75" />
            <polygon points="48,116 70,129 70,165 48,152" fill="currentColor" fillOpacity="0.55" />
            <polygon points="70,129 92,116 92,152 70,165" fill="currentColor" fillOpacity="0.38" />

            {/* Column 2 (Medium — Center) */}
            <polygon points="82,88 104,75 126,88 104,101" fill="currentColor" />
            <polygon points="82,88 104,101 104,165 82,152" fill="currentColor" fillOpacity="0.82" />
            <polygon points="104,101 126,88 126,152 104,165" fill="currentColor" fillOpacity="0.62" />

            {/* Column 3 (Tallest — Signal Orange Growth Peak) */}
            <polygon points="116,54 138,41 160,54 138,67" fill="var(--accent-primary)" />
            <polygon points="116,54 138,67 138,165 116,152" fill="var(--accent-primary)" fillOpacity="0.92" />
            <polygon points="138,67 160,54 160,152 138,165" fill="var(--accent-primary)" fillOpacity="0.74" />

            {/* Bold Ascending Trajectory Arrow ↗ */}
            <path
              d="M44 96 L94 56 L134 22"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="6"
              strokeLinecap="square"
            />
            <polygon points="142,15 116,20 135,39" fill="var(--accent-primary)" />
          </svg>
        </div>
        <span className="growth-node-title growth-node-title-accent">Fast Growth</span>
        <span className="growth-node-sub">More clients &amp; profit</span>
      </div>
    </div>
  );
}
