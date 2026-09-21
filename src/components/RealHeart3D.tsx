"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

interface RealHeart3DProps {
  isDark?: boolean;
}

export const RealHeart3D: React.FC<RealHeart3DProps> = ({ isDark = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Target and current rotation offsets driven by mouse hover
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);

  // Model reference
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Anatomical frontal orientation constants
  // In the raw GLTF, the front faces +X. Rotating by -90° (-PI/2) faces the camera directly!
  const BASE_ROT_X = 0.05;
  const BASE_ROT_Y = -Math.PI / 2;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    // 3. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.7 : 2.1);
    scene.add(ambientLight);

    // Cyan Key Light (Tech illumination from top-left)
    const cyanLight = new THREE.DirectionalLight(0x22d3ee, 3.0);
    cyanLight.position.set(-3, 3, 3);
    scene.add(cyanLight);

    // Purple Accent Light (Atmospheric fill from bottom-right)
    const purpleLight = new THREE.DirectionalLight(0xa855f7, 2.8);
    purpleLight.position.set(3, -2, 2.5);
    scene.add(purpleLight);

    // Top Specular Highlight
    const topLight = new THREE.PointLight(0xffffff, 2.0, 10);
    topLight.position.set(0, 3.5, 1.5);
    scene.add(topLight);

    // 5. Load GLTF Model with Meshopt Decoder
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      "/models/coracao.glb",
      (gltf) => {
        const model = gltf.scene;

        // Auto-center the geometry
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.65 / maxDim; // Generous scale to fill the hero

        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        model.scale.setScalar(scale);

        // Set the exact frontal orientation
        model.rotation.set(BASE_ROT_X, BASE_ROT_Y, 0);

        // Adjust materials for high-end glossy metallic tech finish
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.32;
              mat.metalness = 0.40;
              mat.needsUpdate = true;
            }
          }
        });

        modelGroupRef.current = model;
        scene.add(model);
        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.error("Error loading 3D heart:", err);
      }
    );

    // 6. Animation loop with smooth mouse-incline interpolation
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Fluid dampening (lerp) toward cursor tilt
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.06;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.06;

      const model = modelGroupRef.current;
      if (model) {
        // Subtle organic breathing motion
        const idlePulse = 1 + Math.sin(elapsedTime * 2.0) * 0.012;
        model.scale.setScalar((2.65 / 0.98) * idlePulse);

        // Gentle floating on Y axis
        model.position.y = Math.sin(elapsedTime * 1.4) * 0.035;

        // Apply base frontal angle + smooth mouse tilt
        // Only tilts slightly in the direction of the mouse (~6° max)
        model.rotation.x = BASE_ROT_X + currentRotation.current.x;
        model.rotation.y = BASE_ROT_Y + currentRotation.current.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  // Handle mouse movement — gently tilts in direction of cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Range from -1 (top/left) to +1 (bottom/right)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // Subtle tilt: ~0.11 rad (around 6.5 degrees)
    // Moving mouse to the right tilts heart slightly to the right
    // Moving mouse down tilts heart slightly down
    targetRotation.current = {
      x: normY * 0.09,
      y: normX * 0.12,
    };
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    // Smoothly return to natural front-facing rest position
    targetRotation.current = { x: 0, y: 0 };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[560px] h-[480px] sm:h-[540px] lg:h-[580px] flex items-center justify-center select-none"
    >
      {/* Ambient background glow */}
      <div
        className={`absolute inset-4 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark
            ? "bg-gradient-to-tr from-purple-800/30 via-cyan-500/25 to-indigo-700/25"
            : "bg-gradient-to-tr from-purple-200/55 via-cyan-100/60 to-indigo-100/50"
        }`}
      />

      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`relative w-full h-full z-10 flex items-center justify-center transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};
