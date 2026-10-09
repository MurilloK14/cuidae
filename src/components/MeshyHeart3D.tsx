"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

interface MeshyHeart3DProps {
  isDark?: boolean;
}

export const MeshyHeart3D: React.FC<MeshyHeart3DProps> = ({ isDark = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setRotate({
      x: -normY * 16,
      y: normX * 16,
    });

    setMousePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setMousePos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-80 h-80 sm:w-[460px] sm:h-[460px] flex items-center justify-center cursor-grab select-none"
      style={{ perspective: "1000px" }}
    >
      {/* Interactive 3D Card wrapper */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Ambient back glow */}
        <div
          className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isDark
              ? isHovered
                ? "bg-gradient-to-tr from-blue-600/35 via-[#2b85ff]/35 to-cyan-500/35 scale-110"
                : "bg-gradient-to-tr from-blue-900/25 via-[#2b85ff]/20 to-cyan-800/25 scale-100"
              : isHovered
              ? "bg-gradient-to-tr from-blue-200/60 via-cyan-200/60 to-blue-200/50 scale-110"
              : "bg-gradient-to-tr from-blue-100/50 via-cyan-100/50 to-blue-100/40 scale-100"
          }`}
          style={{ transform: "translateZ(-40px)" }}
        />

        {/* 3D Floating Heart Model from Meshy */}
        <div
          className="relative w-full h-full animate-float flex items-center justify-center"
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="relative w-72 h-72 sm:w-[420px] sm:h-[420px]">
            <Image
              src="/images/meshy_preview.png"
              alt="Circuit Heart 3D Model generated with Meshy AI"
              fill
              priority
              className="object-contain filter drop-shadow-[0_20px_40px_rgba(34,211,238,0.25)] transition-transform duration-300"
              sizes="(max-width: 768px) 320px, 460px"
            />

            {/* Dynamic specular light highlight on mouse hover */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 120px at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,${
                  isHovered ? (isDark ? "0.3" : "0.5") : "0"
                }), transparent 75%)`,
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>

        {/* Interactive 3D telemetry tag */}
        <div
          className="absolute bottom-2 right-4 pointer-events-none px-3 py-1 rounded-full text-[10px] font-mono tracking-wider backdrop-blur-md border bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-cyan-500 font-bold">3D AI MODEL</span> • {isHovered ? "INTERACTING" : "MOUSE SENSITIVE"}
        </div>
      </div>
    </div>
  );
};
