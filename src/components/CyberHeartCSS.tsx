"use client";

import React, { useState, useRef, useEffect } from "react";

interface CyberHeartCSSProps {
  isDark: boolean;
}

export const CyberHeartCSS: React.FC<CyberHeartCSSProps> = ({ isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentage for specular light
  const [isHovered, setIsHovered] = useState(false);
  const [bpm, setBpm] = useState(76);

  // Smooth mouse movement handling
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized from -1 to 1
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Invert Y for natural 3D tilt
    setRotate({
      x: -normY * 18, // max 18 deg tilt
      y: normX * 18,
    });

    setMousePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setBpm(118); // Elevated heart rate on interaction!
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
    setBpm(76);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] flex items-center justify-center cursor-crosshair select-none"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Transformable Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Layer 1: Deep Holographic / Ambient Glow (Back layer - Z: -60px) */}
        <div
          className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isDark
              ? isHovered
                ? "bg-gradient-to-tr from-purple-600/40 via-cyan-500/40 to-indigo-600/40 scale-110"
                : "bg-gradient-to-tr from-purple-800/30 via-cyan-600/25 to-blue-800/30 scale-100"
              : isHovered
              ? "bg-gradient-to-tr from-purple-300/60 via-cyan-200/70 to-indigo-200/60 scale-110"
              : "bg-gradient-to-tr from-purple-200/40 via-cyan-100/50 to-indigo-100/40 scale-100"
          }`}
          style={{ transform: "translateZ(-60px)" }}
        />

        {/* Layer 2: Rotating 3D Orbital Rings (Z: -30px) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: "translateZ(-30px)" }}
        >
          {/* Ring 1 - Tilt 65 deg */}
          <div
            className={`w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-dashed transition-colors duration-500 animate-spin ${
              isDark ? "border-cyan-400/25" : "border-cyan-600/20"
            }`}
            style={{
              transform: "rotateX(65deg) rotateY(15deg)",
              animationDuration: isHovered ? "12s" : "25s",
            }}
          />
          {/* Ring 2 - Tilt -55 deg */}
          <div
            className={`absolute w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full border border-dotted transition-colors duration-500 animate-spin ${
              isDark ? "border-purple-400/30" : "border-purple-600/25"
            }`}
            style={{
              transform: "rotateX(-55deg) rotateY(-20deg)",
              animationDuration: isHovered ? "16s" : "32s",
              animationDirection: "reverse",
            }}
          />
        </div>

        {/* Layer 3: Geodesic Wireframe Polyhedron & Nodes (Z: -10px) */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300"
          style={{ transform: "translateZ(-10px)" }}
        >
          <defs>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Wireframe Polyhedron Edges */}
          <g
            className={`transition-opacity duration-300 ${
              isDark ? "stroke-cyan-400/30" : "stroke-cyan-600/25"
            }`}
            strokeWidth="1"
            fill="none"
          >
            {/* Outer Geodesic Hexagon / Icosahedron segments */}
            <polygon points="200,30 330,105 330,255 200,330 70,255 70,105" />
            <polygon points="200,65 300,125 300,245 200,305 100,245 100,125" strokeDasharray="4 4" />
            <line x1="200" y1="30" x2="200" y2="65" />
            <line x1="330" y1="105" x2="300" y2="125" />
            <line x1="330" y1="255" x2="300" y2="245" />
            <line x1="200" y1="330" x2="200" y2="305" />
            <line x1="70" y1="255" x2="100" y2="245" />
            <line x1="70" y1="105" x2="100" y2="125" />

            {/* Inner cross chords */}
            <line x1="70" y1="105" x2="330" y2="255" strokeOpacity="0.15" />
            <line x1="70" y1="255" x2="330" y2="105" strokeOpacity="0.15" />
          </g>

          {/* Glowing Vertices / Nodes */}
          {[
            { cx: 200, cy: 30 },
            { cx: 330, cy: 105 },
            { cx: 330, cy: 255 },
            { cx: 200, cy: 330 },
            { cx: 70, cy: 255 },
            { cx: 70, cy: 105 },
            { cx: 200, cy: 65 },
            { cx: 300, cy: 125 },
            { cx: 300, cy: 245 },
            { cx: 200, cy: 305 },
            { cx: 100, cy: 245 },
            { cx: 100, cy: 125 },
          ].map((pt, i) => (
            <circle
              key={i}
              cx={pt.cx}
              cy={pt.cy}
              r={isHovered ? "4" : "3"}
              className={`${
                i % 2 === 0
                  ? "fill-cyan-400 dark:fill-cyan-300"
                  : "fill-purple-400 dark:fill-purple-300"
              } transition-all duration-300`}
              filter="url(#nodeGlow)"
            />
          ))}
        </svg>

        {/* Layer 4: The 3D Anatomical Cybernetic Heart (Z: 25px) */}
        <div
          className="relative w-[280px] h-[300px] sm:w-[320px] sm:h-[340px] flex items-center justify-center transition-transform duration-300"
          style={{
            transform: "translateZ(25px)",
            animation: isHovered
              ? "heartbeatQuick 0.52s ease-in-out infinite"
              : "heartbeatNormal 1.05s ease-in-out infinite",
          }}
        >
          {/* Main SVG Vector Anatomical Heart */}
          <svg
            viewBox="0 0 320 340"
            className="w-full h-full drop-shadow-[0_15px_35px_rgba(34,211,238,0.25)]"
          >
            <defs>
              {/* Metallic/Biotech Shading Gradient */}
              <linearGradient id="heartBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={isDark ? "#2a344d" : "#e0e7f1"}
                  stopOpacity="1"
                />
                <stop
                  offset="35%"
                  stopColor={isDark ? "#171e33" : "#cbd5e1"}
                  stopOpacity="1"
                />
                <stop
                  offset="70%"
                  stopColor={isDark ? "#0f1628" : "#94a3b8"}
                  stopOpacity="1"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#1a2238" : "#f1f5f9"}
                  stopOpacity="1"
                />
              </linearGradient>

              {/* Aorta Arch Gradient */}
              <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={isDark ? "#38bdf8" : "#0284c7"}
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? "#1e293b" : "#64748b"}
                  stopOpacity="1"
                />
              </linearGradient>

              {/* Glowing Vein Cyan Gradient */}
              <linearGradient id="cyanVeinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>

              {/* Glowing Vein Purple Gradient */}
              <linearGradient id="purpleVeinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              {/* Glowing Filters */}
              <filter id="circuitGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* --- ANATOMICAL HEART STRUCTURE --- */}
            <g id="heart-anatomy">
              {/* Superior Vena Cava & Aorta Branches (Top Arteries) */}
              <path
                d="M125,50 C125,30 135,20 145,20 C155,20 160,30 160,50 L160,75 L125,75 Z"
                fill="url(#aortaGrad)"
                stroke={isDark ? "#38bdf8" : "#0284c7"}
                strokeWidth="1.5"
              />
              <path
                d="M150,45 C150,22 165,12 180,12 C195,12 205,24 205,45 L205,80 L150,80 Z"
                fill="url(#aortaGrad)"
                stroke={isDark ? "#818cf8" : "#4f46e5"}
                strokeWidth="1.5"
              />
              <path
                d="M195,52 C195,32 208,22 220,22 C232,22 240,32 240,52 L240,90 L195,90 Z"
                fill="url(#aortaGrad)"
                stroke={isDark ? "#c084fc" : "#9333ea"}
                strokeWidth="1.5"
              />

              {/* Pulmonary Trunk & Artery (Arching to left) */}
              <path
                d="M100,85 C90,65 105,50 120,50 C130,50 135,65 135,85 C135,100 110,105 100,85 Z"
                fill="url(#heartBaseGrad)"
                stroke={isDark ? "#22d3ee" : "#0891b2"}
                strokeWidth="1.2"
              />

              {/* Main Heart Muscle / Ventricles Silhouette */}
              <path
                d="M160,75 
                   C210,65 260,85 270,135 
                   C280,185 250,230 200,285 
                   C175,312 160,325 155,325 
                   C150,325 135,312 110,285 
                   C60,230 30,185 40,135 
                   C50,85 100,65 160,75 Z"
                fill="url(#heartBaseGrad)"
                stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.25)"}
                strokeWidth="2"
              />

              {/* Right Atrium & Ventricle Divider Groove */}
              <path
                d="M160,75 C150,140 145,210 155,325"
                stroke={isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)"}
                strokeWidth="2"
                fill="none"
              />

              {/* Biometric Metallic Plate Facets / Cyber Panels */}
              <path
                d="M65,130 Q110,120 145,150 L140,210 Q95,200 65,160 Z"
                fill={isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.4)"}
                stroke={isDark ? "rgba(34,211,238,0.2)" : "rgba(14,165,233,0.3)"}
                strokeWidth="1"
              />
              <path
                d="M175,150 Q215,120 255,135 L245,185 Q205,190 175,170 Z"
                fill={isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.4)"}
                stroke={isDark ? "rgba(168,85,247,0.2)" : "rgba(147,51,234,0.3)"}
                strokeWidth="1"
              />
            </g>

            {/* --- CYBERNETIC CIRCUITRY & GLOWING VEINS --- */}
            <g id="cyber-circuits" filter="url(#circuitGlow)">
              {/* Left Chamber Vein Network (Cyan) */}
              <path
                d="M160,95 L140,115 L140,145 L115,160 L115,195 L85,210"
                fill="none"
                stroke="url(#cyanVeinGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M140,145 L165,165 L165,200 L145,225 L145,265 L155,295"
                fill="none"
                stroke="url(#cyanVeinGrad)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M115,160 L85,150 L75,170"
                fill="none"
                stroke="url(#cyanVeinGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Right Chamber Vein Network (Purple / Magenta) */}
              <path
                d="M170,95 L190,120 L225,130 L235,165 L220,195 L240,225"
                fill="none"
                stroke="url(#purpleVeinGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M190,120 L180,160 L195,190 L185,230 L165,270"
                fill="none"
                stroke="url(#purpleVeinGrad)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M225,130 L250,140 L255,165"
                fill="none"
                stroke="url(#purpleVeinGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Microchip PCB Grid / Circuit Traces */}
              <g stroke="url(#cyanVeinGrad)" strokeWidth="1.2" fill="none" opacity="0.8">
                <path d="M100,185 h20 v20 h-10 v15" />
                <path d="M195,155 h18 v25 h15" />
                <path d="M135,235 h20 v18 h15" />
                <circle cx="100" cy="185" r="2" fill="#22d3ee" />
                <circle cx="110" cy="220" r="2" fill="#22d3ee" />
                <circle cx="228" cy="180" r="2" fill="#c084fc" />
                <circle cx="170" cy="253" r="2" fill="#22d3ee" />
              </g>

              {/* Central AI Nuclear Core / Cybernetic Arc Reactor */}
              <g transform="translate(155, 175)">
                {/* Outer pulsing ring */}
                <circle
                  cx="0"
                  cy="0"
                  r="24"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  className="animate-spin"
                  style={{ animationDuration: isHovered ? "4s" : "10s" }}
                />
                {/* Inner reactor ring */}
                <circle
                  cx="0"
                  cy="0"
                  r="16"
                  fill={isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)"}
                  stroke="#a855f7"
                  strokeWidth="2"
                />
                {/* Glowing Core Center */}
                <circle
                  cx="0"
                  cy="0"
                  r="8"
                  fill="#22d3ee"
                  className={isHovered ? "animate-ping" : "animate-pulse"}
                />
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
              </g>
            </g>
          </svg>

          {/* Dynamic Specular Lighting Layer that follows the Mouse */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 90px at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,${
                isDark ? "0.22" : "0.55"
              }), transparent 80%)`,
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* Layer 5: Interactive 3D HUD Telemetry Overlay (Z: 60px) */}
        <div
          className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6"
          style={{ transform: "translateZ(60px)" }}
        >
          {/* Top HUD badge */}
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider opacity-80">
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-600 dark:text-cyan-300">
              BIO:LIVE
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/30 text-purple-600 dark:text-purple-300 font-semibold">
              {bpm} BPM
            </span>
          </div>

          {/* Bottom HUD indicator */}
          <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500">
            <span>SYS.CORE::ACTIVE</span>
            <span className="text-cyan-500">
              {isHovered ? "INTERACTIVE FOCUS" : "3D MOUSE ORIENTED"}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heartbeatNormal {
          0%, 100% {
            transform: translateZ(25px) scale(1);
          }
          14% {
            transform: translateZ(35px) scale(1.05);
          }
          28% {
            transform: translateZ(28px) scale(0.98);
          }
          42% {
            transform: translateZ(40px) scale(1.08);
          }
          70% {
            transform: translateZ(25px) scale(1);
          }
        }

        @keyframes heartbeatQuick {
          0%, 100% {
            transform: translateZ(25px) scale(1.02);
          }
          15% {
            transform: translateZ(42px) scale(1.1);
          }
          30% {
            transform: translateZ(30px) scale(0.97);
          }
          45% {
            transform: translateZ(48px) scale(1.14);
          }
          70% {
            transform: translateZ(25px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};
