"use client";

import React from "react";

/**
 * HeartVisual — A fully inline SVG + CSS anatomical cybernetic heart
 * with wireframe polyhedron, glowing circuits, 3D gradients, and
 * subtle premium animations. No raster images. Fully responsive.
 */
export const HeartVisual: React.FC = () => {
  return (
    <div className="heart-visual-wrapper">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 900"
        className="heart-visual-svg"
        aria-label="Cybernetic anatomical heart illustration"
        role="img"
      >
        {/* ========================================== */}
        {/* DEFS: Gradients, Filters, Glow Effects     */}
        {/* ========================================== */}
        <defs>
          {/* --- Body Gradients --- */}
          <linearGradient id="hv-body-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8d4e8" />
            <stop offset="22%" stopColor="#90b8d4" />
            <stop offset="50%" stopColor="#7bacc8" />
            <stop offset="72%" stopColor="#a5b8d0" />
            <stop offset="100%" stopColor="#c5d3e5" />
          </linearGradient>

          <linearGradient id="hv-body-deep" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#8ea8c8" />
            <stop offset="40%" stopColor="#5e80a8" />
            <stop offset="70%" stopColor="#4a6e96" />
            <stop offset="100%" stopColor="#7090b4" />
          </linearGradient>

          <linearGradient id="hv-body-right" x1="0%" y1="10%" x2="100%" y2="90%">
            <stop offset="0%" stopColor="#8aacce" />
            <stop offset="35%" stopColor="#6b8cb8" />
            <stop offset="60%" stopColor="#7b98c0" />
            <stop offset="100%" stopColor="#9db6d4" />
          </linearGradient>

          {/* --- Specular Highlight Gradient (light from upper-left) --- */}
          <radialGradient id="hv-specular" cx="32%" cy="25%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="0.50" />
            <stop offset="40%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="hv-specular-small" cx="40%" cy="20%" r="40%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* --- Aorta / Vessel Gradients --- */}
          <linearGradient id="hv-aorta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b0c8e0" />
            <stop offset="30%" stopColor="#8aaac8" />
            <stop offset="60%" stopColor="#97a8c4" />
            <stop offset="100%" stopColor="#c0cedf" />
          </linearGradient>

          <linearGradient id="hv-vessel-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9abcda" />
            <stop offset="50%" stopColor="#6898ba" />
            <stop offset="100%" stopColor="#88b0ce" />
          </linearGradient>

          <linearGradient id="hv-vessel-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8a0d2" />
            <stop offset="50%" stopColor="#9580b8" />
            <stop offset="100%" stopColor="#c0aad8" />
          </linearGradient>

          <linearGradient id="hv-vessel-left" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a0c0dc" />
            <stop offset="50%" stopColor="#708eac" />
            <stop offset="100%" stopColor="#92aac4" />
          </linearGradient>

          {/* --- Vessel Opening Rim Gradients --- */}
          <radialGradient id="hv-opening-1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a6a90" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#6a8ab0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#90b0cc" stopOpacity="0.4" />
          </radialGradient>

          <radialGradient id="hv-opening-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6a5090" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#8a70b0" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#b098cc" stopOpacity="0.3" />
          </radialGradient>

          {/* --- Shadow / Depth Gradients --- */}
          <linearGradient id="hv-shadow-bottom" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#4a6a90" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a5070" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="hv-groove" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#506a88" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#405a78" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#607a98" stopOpacity="0.3" />
          </linearGradient>

          {/* --- Circuit Glow Gradients --- */}
          <linearGradient id="hv-circuit-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>

          <linearGradient id="hv-circuit-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>

          <linearGradient id="hv-circuit-mixed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* --- Wireframe Gradient --- */}
          <linearGradient id="hv-wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a0b8d4" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#b8a8d0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#90a8c8" stopOpacity="0.35" />
          </linearGradient>

          {/* --- Wireframe Node Glow --- */}
          <radialGradient id="hv-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="hv-node-glow-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>

          {/* --- Core Reactor Glow --- */}
          <radialGradient id="hv-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="20%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>

          {/* --- Filters --- */}
          <filter id="hv-glow-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hv-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hv-node-filter" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hv-shadow" x="-20%" y="-5%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#3a506a" floodOpacity="0.3" />
          </filter>

          <filter id="hv-circuit-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path for circuits to stay within heart boundary */}
          <clipPath id="hv-heart-clip">
            <path d="M400,190 C480,170 560,195 585,260 C610,330 580,410 530,500 C490,570 440,640 400,710 C360,640 310,570 270,500 C220,410 190,330 215,260 C240,195 320,170 400,190 Z" />
          </clipPath>
        </defs>

        {/* ========================================== */}
        {/* LAYER 1: WIREFRAME POLYHEDRON (Behind)     */}
        {/* ========================================== */}
        <g className="hv-wireframe">
          {/* Edges forming an irregular geodesic sphere */}
          <g stroke="url(#hv-wire-grad)" strokeWidth="1.1" fill="none" strokeLinecap="round">
            {/* Top region */}
            <line x1="400" y1="40" x2="540" y2="110" />
            <line x1="400" y1="40" x2="260" y2="110" />
            <line x1="400" y1="40" x2="400" y2="130" />
            <line x1="400" y1="40" x2="310" y2="60" />
            <line x1="400" y1="40" x2="490" y2="60" />

            {/* Upper middle */}
            <line x1="260" y1="110" x2="160" y2="230" />
            <line x1="260" y1="110" x2="310" y2="220" />
            <line x1="260" y1="110" x2="400" y2="130" />
            <line x1="540" y1="110" x2="640" y2="230" />
            <line x1="540" y1="110" x2="490" y2="220" />
            <line x1="540" y1="110" x2="400" y2="130" />

            {/* Side region */}
            <line x1="160" y1="230" x2="110" y2="400" />
            <line x1="160" y1="230" x2="220" y2="350" />
            <line x1="160" y1="230" x2="310" y2="220" />
            <line x1="640" y1="230" x2="690" y2="400" />
            <line x1="640" y1="230" x2="580" y2="350" />
            <line x1="640" y1="230" x2="490" y2="220" />

            {/* Middle cross bracing */}
            <line x1="310" y1="220" x2="490" y2="220" />
            <line x1="310" y1="220" x2="220" y2="350" />
            <line x1="490" y1="220" x2="580" y2="350" />
            <line x1="310" y1="220" x2="400" y2="370" />
            <line x1="490" y1="220" x2="400" y2="370" />

            {/* Lower middle */}
            <line x1="110" y1="400" x2="160" y2="560" />
            <line x1="110" y1="400" x2="220" y2="350" />
            <line x1="110" y1="400" x2="200" y2="530" />
            <line x1="690" y1="400" x2="640" y2="560" />
            <line x1="690" y1="400" x2="580" y2="350" />
            <line x1="690" y1="400" x2="600" y2="530" />

            <line x1="220" y1="350" x2="580" y2="350" />
            <line x1="220" y1="350" x2="200" y2="530" />
            <line x1="220" y1="350" x2="400" y2="370" />
            <line x1="580" y1="350" x2="600" y2="530" />
            <line x1="580" y1="350" x2="400" y2="370" />

            {/* Lower region */}
            <line x1="160" y1="560" x2="260" y2="680" />
            <line x1="160" y1="560" x2="200" y2="530" />
            <line x1="640" y1="560" x2="540" y2="680" />
            <line x1="640" y1="560" x2="600" y2="530" />
            <line x1="200" y1="530" x2="600" y2="530" />
            <line x1="200" y1="530" x2="260" y2="680" />
            <line x1="200" y1="530" x2="400" y2="580" />
            <line x1="600" y1="530" x2="540" y2="680" />
            <line x1="600" y1="530" x2="400" y2="580" />

            {/* Bottom convergence */}
            <line x1="260" y1="680" x2="400" y2="790" />
            <line x1="260" y1="680" x2="540" y2="680" />
            <line x1="260" y1="680" x2="400" y2="580" />
            <line x1="540" y1="680" x2="400" y2="790" />
            <line x1="540" y1="680" x2="400" y2="580" />
            <line x1="400" y1="580" x2="400" y2="790" />

            {/* Extra diagonal bracing for density */}
            <line x1="310" y1="60" x2="160" y2="230" opacity="0.4" />
            <line x1="490" y1="60" x2="640" y2="230" opacity="0.4" />
            <line x1="310" y1="60" x2="260" y2="110" opacity="0.5" />
            <line x1="490" y1="60" x2="540" y2="110" opacity="0.5" />
            <line x1="400" y1="130" x2="400" y2="370" opacity="0.25" />
          </g>

          {/* Wireframe vertex nodes with glow */}
          <g>
            {[
              { x: 400, y: 40, type: "cyan" },
              { x: 260, y: 110, type: "purple" },
              { x: 540, y: 110, type: "cyan" },
              { x: 310, y: 60, type: "purple" },
              { x: 490, y: 60, type: "cyan" },
              { x: 160, y: 230, type: "cyan" },
              { x: 640, y: 230, type: "purple" },
              { x: 310, y: 220, type: "purple" },
              { x: 490, y: 220, type: "cyan" },
              { x: 110, y: 400, type: "cyan" },
              { x: 690, y: 400, type: "cyan" },
              { x: 220, y: 350, type: "purple" },
              { x: 580, y: 350, type: "cyan" },
              { x: 400, y: 370, type: "purple" },
              { x: 160, y: 560, type: "cyan" },
              { x: 640, y: 560, type: "purple" },
              { x: 200, y: 530, type: "cyan" },
              { x: 600, y: 530, type: "purple" },
              { x: 400, y: 580, type: "cyan" },
              { x: 260, y: 680, type: "purple" },
              { x: 540, y: 680, type: "cyan" },
              { x: 400, y: 790, type: "purple" },
              { x: 400, y: 130, type: "cyan" },
            ].map((node, i) => (
              <g key={i}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill={
                    node.type === "cyan"
                      ? "url(#hv-node-glow)"
                      : "url(#hv-node-glow-purple)"
                  }
                  filter="url(#hv-node-filter)"
                  className={
                    i % 3 === 0
                      ? "hv-node-pulse-a"
                      : i % 3 === 1
                      ? "hv-node-pulse-b"
                      : "hv-node-pulse-c"
                  }
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="2.5"
                  fill={node.type === "cyan" ? "#67e8f9" : "#d8b4fe"}
                />
              </g>
            ))}
          </g>
        </g>

        {/* ========================================== */}
        {/* LAYER 2: VESSELS BEHIND HEART              */}
        {/* ========================================== */}
        <g className="hv-heart-back" filter="url(#hv-shadow)">
          {/* Left pulmonary veins (behind, entering left atrium) */}
          <path
            d="M280,260 C255,250 230,230 215,210 C205,196 198,178 202,168 C208,155 225,150 240,158 C252,165 260,180 265,200 C270,220 275,240 280,260 Z"
            fill="url(#hv-vessel-left)"
            stroke="#7a98b8" strokeWidth="1"
          />
          {/* Vessel opening rim */}
          <ellipse cx="216" cy="172" rx="11" ry="7" fill="url(#hv-opening-1)" transform="rotate(-30,216,172)" />

          {/* Right pulmonary veins (behind, right side) */}
          <path
            d="M520,240 C545,225 565,210 580,195 C590,183 598,168 594,158 C588,145 570,140 558,150 C548,158 540,175 535,195 C530,215 525,228 520,240 Z"
            fill="url(#hv-vessel-purple)"
            stroke="#9a80b8" strokeWidth="1"
          />
          <ellipse cx="585" cy="163" rx="10" ry="7" fill="url(#hv-opening-purple)" transform="rotate(25,585,163)" />

          {/* Inferior vena cava (behind bottom right) */}
          <path
            d="M480,560 C505,580 525,610 530,640 C532,658 528,672 518,676 C505,680 492,670 488,654 C485,640 484,615 482,590 C481,575 480,565 480,560 Z"
            fill="url(#hv-vessel-blue)"
            stroke="#7a98b8" strokeWidth="1"
          />
          <ellipse cx="521" cy="665" rx="9" ry="12" fill="url(#hv-opening-1)" transform="rotate(10,521,665)" />
        </g>

        {/* ========================================== */}
        {/* LAYER 3: MAIN HEART BODY                   */}
        {/* ========================================== */}
        <g className="hv-heart-main" filter="url(#hv-shadow)">
          {/* ---- LEFT VENTRICLE (viewer's right, anatomically left) ---- */}
          <path
            d="M400,200 
               C440,190 475,200 505,225 
               C540,255 565,300 575,350 
               C585,410 570,470 545,520 
               C520,565 480,610 440,655 
               C420,680 408,700 400,715 
               Z"
            fill="url(#hv-body-right)"
            stroke="#7a98b8" strokeWidth="1.5" strokeOpacity="0.5"
          />

          {/* ---- RIGHT VENTRICLE (viewer's left) ---- */}
          <path
            d="M400,200
               C360,190 325,200 295,225
               C260,255 235,300 225,350
               C215,410 230,470 255,520
               C280,565 320,610 360,655
               C380,680 393,700 400,715
               Z"
            fill="url(#hv-body-main)"
            stroke="#7a98b8" strokeWidth="1.5" strokeOpacity="0.5"
          />

          {/* ---- Interventricular Septum Groove (divider) ---- */}
          <path
            d="M400,210 C395,300 392,420 396,550 C398,620 399,680 400,715"
            fill="none"
            stroke="url(#hv-groove)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* ---- Left Atrium Upper Region ---- */}
          <path
            d="M400,200 C430,185 460,188 485,205 
               C510,225 525,248 530,270
               C535,292 530,300 520,298
               C510,296 495,278 480,262
               C460,240 435,220 400,210 Z"
            fill="url(#hv-body-deep)"
            stroke="#6a88a8" strokeWidth="1" strokeOpacity="0.3"
          />

          {/* ---- Right Atrium Upper Region ---- */}
          <path
            d="M400,200 C370,185 340,188 315,205
               C290,225 275,248 270,270
               C265,292 270,300 280,298
               C290,296 305,278 320,262
               C340,240 365,220 400,210 Z"
            fill="url(#hv-body-deep)"
            stroke="#6a88a8" strokeWidth="1" strokeOpacity="0.3"
          />

          {/* ---- Metallic surface panels / facets ---- */}
          {/* Left facet */}
          <path
            d="M260,310 Q310,290 370,330 L360,430 Q300,415 260,370 Z"
            fill="white" fillOpacity="0.06"
            stroke="#8ab0d0" strokeWidth="0.8" strokeOpacity="0.25"
          />
          {/* Right facet */}
          <path
            d="M440,320 Q490,295 540,340 L525,430 Q480,420 440,380 Z"
            fill="white" fillOpacity="0.06"
            stroke="#a090c4" strokeWidth="0.8" strokeOpacity="0.25"
          />
          {/* Lower mid facet */}
          <path
            d="M340,490 Q400,475 460,490 L445,570 Q400,580 355,570 Z"
            fill="white" fillOpacity="0.04"
            stroke="#8ab0d0" strokeWidth="0.6" strokeOpacity="0.2"
          />

          {/* ---- Specular highlights ---- */}
          <path
            d="M310,240 C340,220 375,210 400,210 C365,220 335,248 310,280 C290,305 278,330 270,350 C275,315 290,265 310,240 Z"
            fill="url(#hv-specular-small)"
          />
          <path
            d="M400,220 C430,215 460,220 485,235 C475,228 458,222 440,222 C425,222 412,222 400,225 Z"
            fill="white" fillOpacity="0.35"
          />

          {/* ---- Shadow overlay (bottom) ---- */}
          <path
            d="M300,580 C340,630 380,680 400,715 C420,680 460,630 500,580 C530,540 555,490 565,440 C560,500 535,560 500,600 C460,645 425,690 400,715 C375,690 340,645 300,600 C265,560 240,500 235,440 C245,490 270,540 300,580 Z"
            fill="url(#hv-shadow-bottom)"
          />
        </g>

        {/* ========================================== */}
        {/* LAYER 4: MAJOR VESSELS (FRONT)             */}
        {/* ========================================== */}
        <g className="hv-vessels">
          {/* ---- AORTA (main, arching right to left) ---- */}
          <path
            d="M385,205 
               C385,175 380,145 378,120
               C375,90 380,60 400,45
               C420,28 448,38 460,60
               C475,85 478,110 475,135
               C472,155 465,175 455,200
               C445,230 425,228 415,218
               C405,210 395,208 385,205 Z"
            fill="url(#hv-aorta-grad)"
            stroke="#7a98b8" strokeWidth="1.5"
          />
          {/* Aorta opening */}
          <ellipse cx="400" cy="42" rx="22" ry="10" fill="url(#hv-opening-1)" />
          <ellipse cx="400" cy="42" rx="14" ry="6" fill="#3a5878" fillOpacity="0.8" />
          {/* Aorta specular */}
          <path
            d="M388,70 C385,90 384,120 385,150 C386,120 388,92 392,70 Z"
            fill="white" fillOpacity="0.45"
          />

          {/* ---- Superior Vena Cava (right of aorta) ---- */}
          <path
            d="M340,208 
               C338,185 332,155 330,130
               C328,105 330,80 340,62
               C348,50 358,45 365,48
               C372,52 375,65 374,85
               C373,110 370,140 368,170
               C366,190 360,205 350,210
               C345,212 342,210 340,208 Z"
            fill="url(#hv-vessel-blue)"
            stroke="#7a98b8" strokeWidth="1.2"
          />
          <ellipse cx="340" cy="58" rx="15" ry="8" fill="url(#hv-opening-1)" />
          <ellipse cx="340" cy="58" rx="9" ry="4.5" fill="#3a5878" fillOpacity="0.7" />
          {/* SVC specular */}
          <path
            d="M343,75 C341,95 340,120 341,150 C342,120 343,96 346,75 Z"
            fill="white" fillOpacity="0.4"
          />

          {/* ---- Pulmonary Trunk (front-left, going up) ---- */}
          <path
            d="M420,215
               C430,195 445,170 458,145
               C468,128 480,110 495,100
               C508,92 520,90 528,98
               C535,108 532,125 522,140
               C510,160 495,178 478,195
               C465,208 448,218 430,220
               C425,221 422,218 420,215 Z"
            fill="url(#hv-vessel-purple)"
            stroke="#9a80b8" strokeWidth="1.2"
          />
          <ellipse cx="525" cy="98" rx="12" ry="8" fill="url(#hv-opening-purple)" transform="rotate(35,525,98)" />
          <ellipse cx="525" cy="98" rx="7" ry="4" fill="#5a4078" fillOpacity="0.7" transform="rotate(35,525,98)" />

          {/* ---- Left Pulmonary Artery (branching left from trunk) ---- */}
          <path
            d="M462,150
               C450,140 432,130 418,125
               C405,120 390,118 378,120
               C368,122 362,128 365,136
               C370,145 382,148 395,148
               C410,148 428,146 445,148
               C455,149 460,150 462,150 Z"
            fill="url(#hv-vessel-purple)"
            stroke="#9a80b8" strokeWidth="1" strokeOpacity="0.7"
          />
          {/* Branch opening */}
          <ellipse cx="370" cy="128" rx="8" ry="6" fill="url(#hv-opening-purple)" transform="rotate(-15,370,128)" />

          {/* ---- Right Coronary Artery (wrapping around right side) ---- */}
          <path
            d="M435,230 C455,245 470,265 478,288 C482,300 480,310 474,312 C468,314 462,306 458,292 C452,272 445,255 435,240 Z"
            fill="url(#hv-vessel-blue)"
            stroke="#7a98b8" strokeWidth="0.8" strokeOpacity="0.6"
          />

          {/* ---- Left Coronary Artery (wrapping around left) ---- */}
          <path
            d="M365,235 C345,250 330,270 322,295 C318,308 320,318 326,320 C332,322 338,312 342,298 C348,278 355,258 365,245 Z"
            fill="url(#hv-vessel-blue)"
            stroke="#7a98b8" strokeWidth="0.8" strokeOpacity="0.6"
          />

          {/* ---- Small coronary branch (left lower) ---- */}
          <path
            d="M310,380 C298,395 290,415 288,435 C287,445 290,450 295,448 C300,445 303,432 305,418 C308,400 310,388 310,380 Z"
            fill="url(#hv-vessel-blue)"
            stroke="#7a98b8" strokeWidth="0.6" strokeOpacity="0.5"
          />

          {/* ---- Small coronary branch (right lower) ---- */}
          <path
            d="M490,395 C502,412 508,432 510,450 C511,462 508,468 503,465 C498,462 496,445 494,428 C492,412 490,400 490,395 Z"
            fill="url(#hv-vessel-purple)"
            stroke="#9a80b8" strokeWidth="0.6" strokeOpacity="0.5"
          />
        </g>

        {/* ========================================== */}
        {/* LAYER 5: CYBERNETIC CIRCUITS               */}
        {/* ========================================== */}
        <g className="hv-circuits" clipPath="url(#hv-heart-clip)">
          {/* --- Main Circuit Network (Cyan) --- */}
          <g filter="url(#hv-circuit-blur)">
            {/* Central vertical trunk */}
            <path
              d="M400,230 L400,280 L395,320 L395,380 L400,440 L400,520 L395,580 L400,650"
              fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="2" strokeLinecap="round"
              className="hv-circuit-pulse-a"
            />

            {/* Left branch network */}
            <path d="M395,280 L355,300 L330,300 L310,310" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M330,300 L330,340 L310,360" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M310,310 L310,340" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1" strokeLinecap="round" />
            <path d="M355,300 L345,330 L345,370 L330,400" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M330,400 L310,420 L310,450" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1" strokeLinecap="round" />
            <path d="M345,370 L325,380" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="0.8" strokeLinecap="round" />

            {/* Lower left branch */}
            <path d="M395,440 L365,460 L340,460 L320,475" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M340,460 L340,490 L325,510" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1" strokeLinecap="round" />
            <path d="M365,460 L360,495 L370,530" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="1" strokeLinecap="round" />

            {/* Right branch network */}
            <path d="M400,280 L440,295 L470,295 L495,305" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1.5" strokeLinecap="round" className="hv-circuit-pulse-b" />
            <path d="M470,295 L475,330 L490,360" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M440,295 L450,325 L450,370 L465,400" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M465,400 L485,420 L490,455" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1" strokeLinecap="round" />
            <path d="M450,370 L470,378" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="0.8" strokeLinecap="round" />

            {/* Lower right branch */}
            <path d="M400,440 L435,458 L460,458 L480,475" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M460,458 L462,490 L475,512" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1" strokeLinecap="round" />
            <path d="M435,458 L438,498 L428,535" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="1" strokeLinecap="round" />

            {/* Cross connections */}
            <path d="M330,340 L345,340" fill="none" stroke="url(#hv-circuit-cyan)" strokeWidth="0.8" />
            <path d="M470,330 L450,330" fill="none" stroke="url(#hv-circuit-purple)" strokeWidth="0.8" />
            <path d="M360,495 L440,495" fill="none" stroke="url(#hv-circuit-mixed)" strokeWidth="0.8" />
          </g>

          {/* --- PCB Grid Patterns --- */}
          <g opacity="0.6">
            {/* Left PCB block */}
            <path d="M285,340 h25 v22 h-12 v18" fill="none" stroke="#22d3ee" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M285,340 v15 h-10" fill="none" stroke="#22d3ee" strokeWidth="0.7" strokeLinecap="round" />
            <path d="M298,340 v-10 h12" fill="none" stroke="#22d3ee" strokeWidth="0.7" strokeLinecap="round" />

            {/* Right PCB block */}
            <path d="M500,340 h-25 v22 h12 v18" fill="none" stroke="#a855f7" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M500,340 v15 h10" fill="none" stroke="#a855f7" strokeWidth="0.7" strokeLinecap="round" />

            {/* Center-left block */}
            <path d="M320,480 h18 v15 h-8 v12" fill="none" stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M328,480 v-8 h10" fill="none" stroke="#22d3ee" strokeWidth="0.6" />

            {/* Center-right block */}
            <path d="M460,480 h-18 v15 h8 v12" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M452,480 v-8 h-10" fill="none" stroke="#a855f7" strokeWidth="0.6" />

            {/* Small lower block */}
            <path d="M375,560 h12 v10 h8" fill="none" stroke="#22d3ee" strokeWidth="0.7" />
            <path d="M425,560 h-12 v10 h-8" fill="none" stroke="#a855f7" strokeWidth="0.7" />
          </g>

          {/* --- Circuit Junction Dots --- */}
          <g filter="url(#hv-glow-soft)">
            {/* Cyan nodes */}
            {[
              [310, 310], [310, 360], [330, 300], [330, 340], [330, 400],
              [310, 450], [320, 475], [325, 510], [345, 370], [340, 490],
              [370, 530], [285, 340], [298, 362], [320, 480], [375, 560],
              [395, 280], [395, 380], [400, 440], [400, 520], [395, 650],
            ].map(([cx, cy], i) => (
              <circle
                key={`cn-${i}`}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="#22d3ee"
                className={i % 4 === 0 ? "hv-dot-blink-a" : i % 4 === 2 ? "hv-dot-blink-b" : ""}
              />
            ))}

            {/* Purple nodes */}
            {[
              [495, 305], [490, 360], [470, 295], [475, 330], [465, 400],
              [490, 455], [480, 475], [475, 512], [450, 370], [462, 490],
              [428, 535], [500, 340], [488, 362], [460, 480], [425, 560],
              [440, 295], [450, 325],
            ].map(([cx, cy], i) => (
              <circle
                key={`pn-${i}`}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="#a855f7"
                className={i % 3 === 0 ? "hv-dot-blink-a" : i % 3 === 1 ? "hv-dot-blink-c" : ""}
              />
            ))}
          </g>

          {/* --- Central AI Core / Arc Reactor --- */}
          <g transform="translate(400,400)" filter="url(#hv-glow-strong)">
            <circle r="38" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="6 4" className="hv-core-spin" />
            <circle r="28" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 8" className="hv-core-spin-reverse" />
            <circle r="20" fill="none" stroke="#67e8f9" strokeWidth="1" />
            <circle r="14" fill="url(#hv-core-glow)" className="hv-core-breathe" />
            <circle r="5" fill="white" />
          </g>
        </g>

        {/* ========================================== */}
        {/* LAYER 6: HIGHLIGHTS & FINISHING TOUCHES    */}
        {/* ========================================== */}
        <g className="hv-highlights">
          {/* Top-left specular across whole heart */}
          <path
            d="M300,230 C330,215 365,208 400,210 C370,218 340,240 315,270 C295,295 280,325 270,355 C275,320 285,265 300,240 Z"
            fill="white" fillOpacity="0.18"
          />

          {/* Rim light right edge */}
          <path
            d="M560,320 C568,350 572,390 570,430 C568,470 558,510 540,545 C555,505 565,460 568,415 C570,380 567,345 560,320 Z"
            fill="white" fillOpacity="0.12"
          />

          {/* Aorta tube shine */}
          <path
            d="M390,80 C388,100 387,130 388,165 C390,130 392,102 394,80 Z"
            fill="white" fillOpacity="0.5"
          />

          {/* Small glint spots */}
          <circle cx="310" cy="250" r="3" fill="white" fillOpacity="0.3" />
          <circle cx="335" cy="215" r="2" fill="white" fillOpacity="0.4" />
          <circle cx="480" cy="240" r="2.5" fill="white" fillOpacity="0.25" />
          <circle cx="530" cy="275" r="2" fill="white" fillOpacity="0.3" />
          <circle cx="290" cy="400" r="2" fill="white" fillOpacity="0.2" />

          {/* Subtle ambient glow behind entire heart */}
          <ellipse
            cx="400" cy="430"
            rx="200" ry="250"
            fill="url(#hv-core-glow)"
            opacity="0.06"
            className="hv-ambient-breathe"
          />
        </g>
      </svg>

      {/* ========================================== */}
      {/* CSS: Animations                            */}
      {/* ========================================== */}
      <style jsx>{`
        .heart-visual-wrapper {
          width: 100%;
          max-width: 520px;
          aspect-ratio: 800 / 900;
          margin: 0 auto;
          overflow: visible;
        }

        .heart-visual-svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }

        /* --- Float animation --- */
        .hv-heart-main,
        .hv-vessels,
        .hv-heart-back,
        .hv-circuits,
        .hv-highlights {
          animation: hv-float 6s ease-in-out infinite;
        }

        @keyframes hv-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }

        /* --- Wireframe stays still while heart floats --- */

        /* --- Core spin --- */
        .hv-core-spin {
          animation: hv-spin 18s linear infinite;
          transform-origin: center;
        }
        .hv-core-spin-reverse {
          animation: hv-spin 24s linear infinite reverse;
          transform-origin: center;
        }

        @keyframes hv-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* --- Core breathing glow --- */
        .hv-core-breathe {
          animation: hv-breathe 3s ease-in-out infinite;
        }

        @keyframes hv-breathe {
          0%, 100% { r: 14; opacity: 0.8; }
          50%      { r: 18; opacity: 1; }
        }

        /* --- Ambient backdrop breathe --- */
        .hv-ambient-breathe {
          animation: hv-ambient 5s ease-in-out infinite;
        }

        @keyframes hv-ambient {
          0%, 100% { opacity: 0.04; }
          50%      { opacity: 0.09; }
        }

        /* --- Node pulse variations --- */
        .hv-node-pulse-a {
          animation: hv-node-fade 4s ease-in-out infinite;
        }
        .hv-node-pulse-b {
          animation: hv-node-fade 4s ease-in-out 1.3s infinite;
        }
        .hv-node-pulse-c {
          animation: hv-node-fade 4s ease-in-out 2.6s infinite;
        }

        @keyframes hv-node-fade {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }

        /* --- Circuit trace pulses --- */
        .hv-circuit-pulse-a {
          stroke-dasharray: 8 4;
          animation: hv-dash 4s linear infinite;
        }
        .hv-circuit-pulse-b {
          stroke-dasharray: 6 6;
          animation: hv-dash 5s linear infinite;
        }

        @keyframes hv-dash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -48; }
        }

        /* --- Dot blink variations --- */
        .hv-dot-blink-a {
          animation: hv-blink 3s ease-in-out infinite;
        }
        .hv-dot-blink-b {
          animation: hv-blink 3s ease-in-out 1s infinite;
        }
        .hv-dot-blink-c {
          animation: hv-blink 3s ease-in-out 2s infinite;
        }

        @keyframes hv-blink {
          0%, 100% { opacity: 0.4; r: 2; }
          50%      { opacity: 1;   r: 3.5; }
        }

        /* --- Reduced motion --- */
        @media (prefers-reduced-motion: reduce) {
          .hv-heart-main,
          .hv-vessels,
          .hv-heart-back,
          .hv-circuits,
          .hv-highlights,
          .hv-core-spin,
          .hv-core-spin-reverse,
          .hv-core-breathe,
          .hv-ambient-breathe,
          .hv-node-pulse-a,
          .hv-node-pulse-b,
          .hv-node-pulse-c,
          .hv-circuit-pulse-a,
          .hv-circuit-pulse-b,
          .hv-dot-blink-a,
          .hv-dot-blink-b,
          .hv-dot-blink-c {
            animation: none !important;
          }
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .heart-visual-wrapper {
            max-width: 360px;
          }
        }

        @media (max-width: 480px) {
          .heart-visual-wrapper {
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  );
};
