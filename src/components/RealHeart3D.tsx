"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Loader2 } from "lucide-react";

interface RealHeart3DProps {
  pulseRate?: number; // e.g. 72 bpm
  className?: string;
}

export const RealHeart3D: React.FC<RealHeart3DProps> = ({
  pulseRate = 72,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  // Target and current rotation offsets driven by mouse hover
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Model reference
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Anatomical frontal orientation constants
  const BASE_ROT_X = 0.05;
  const BASE_ROT_Y = -Math.PI / 2;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.9);

    // 3. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 4. Clean Medical Lighting Setup (Cuidae Palette)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    // Crisp Azure Blue Key Light (Tech illumination from top-left)
    const azureLight = new THREE.DirectionalLight(0x2b85ff, 3.2);
    azureLight.position.set(-3, 3, 3);
    scene.add(azureLight);

    // Soft Sky Fill Light
    const skyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    skyLight.position.set(3, -2, 2.5);
    scene.add(skyLight);

    // Top Specular Highlight
    const topLight = new THREE.PointLight(0xffffff, 2.2, 10);
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
        const scale = 2.7 / maxDim;

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
            if (
              mesh.material &&
              (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial
            ) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.3;
              mat.metalness = 0.38;
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
        console.error("Error loading 3D heart model:", err);
        setLoadError(true);
      }
    );

    // 6. Animation loop with pulse and smooth cursor tilt
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Fluid dampening (lerp) toward cursor tilt
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.08;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.08;

      const model = modelGroupRef.current;
      if (model) {
        // Organic pulse scaled by pulseRate (72 bpm ~ 1.2 Hz)
        const pulseSpeed = (pulseRate / 60) * Math.PI * 2;
        const pulse = 1 + Math.sin(elapsedTime * pulseSpeed) * 0.015;
        model.scale.setScalar((2.7 / 0.98) * pulse);

        // Gentle floating on Y axis
        model.position.y = Math.sin(elapsedTime * 1.5) * 0.03;

        // Apply base frontal angle + smooth mouse tilt
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
  }, [pulseRate]);

  // Handle mouse movement — gently tilts in direction of cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    targetRotation.current = {
      x: normY * 0.12,
      y: normX * 0.15,
    };
  };

  const handleMouseLeave = () => {
    targetRotation.current = { x: 0, y: 0 };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-[400px] sm:h-[480px] lg:h-[520px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Soft Ambient Radial Glow (Cuidae Azure) */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-[#1672eb]/20 via-[#38bdf8]/25 to-indigo-500/15 blur-3xl pointer-events-none" />

      {/* Loading state indicator */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs z-20">
          <Loader2 className="w-8 h-8 text-[#1672eb] animate-spin" />
          <span className="font-medium">Carregando modelo 3D...</span>
        </div>
      )}

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
