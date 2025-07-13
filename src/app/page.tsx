"use client";

import Link from "next/link";
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Three.js scene
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    // Offset the camera so the globe appears at the bottom right
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 1.8);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const orbitCtrl = new OrbitControls(camera, renderer.domElement);
    orbitCtrl.enableDamping = true;

    // Textures loading
    const textureLoader = new THREE.TextureLoader();
    const colorMap = textureLoader.load("/textures/earth/00_earthmap1k.jpg");
    const elevMap = textureLoader.load("/textures/earth/01_earthbump1k.jpg");

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Move the globe to the bottom right by offsetting its position
    globeGroup.position.set(0.5, -0.5, 0); // x: right, y: down, z: unchanged

    // Vertex earth
    const detail = 160;
    const pointsGeo = new THREE.IcosahedronGeometry(1, detail);

    const vertexShader = `
      uniform float size;
      uniform sampler2D elevTexture;

      varying vec2 vUv;
      varying float vVisible;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float elv = texture2D(elevTexture, vUv).r;
        vec3 vNormal = normalMatrix * normal;
        vVisible = dot(-normalize(mvPosition.xyz), normalize(vNormal));
        mvPosition.z += 0.35 * elv;
        gl_PointSize = size;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragmentShader = `
      uniform sampler2D colorTexture;

      varying vec2 vUv;
      varying float vVisible;

      void main() {
        float edge = smoothstep(0.0, 1.0, vVisible);
        vec3 color = texture2D(colorTexture, vUv).rgb;
        gl_FragColor = vec4(color, edge); // Use edge for alpha
      }
    `;
    const uniforms = {
      size: { type: "f", value: 4.0 },
      colorTexture: { type: "t", value: colorMap },
      elevTexture: { type: "t", value: elevMap }
    };
    const pointsMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    });

    const points = new THREE.Points(pointsGeo, pointsMat);
    globeGroup.add(points);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
    scene.add(hemiLight);

    // Animation loop
    const animate = () => {
      renderer.render(scene, camera);
      globeGroup.rotation.y += 0.0002;
      orbitCtrl.update();
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col justify-center relative">
      {/* Three.js container */}
      <div 
        ref={mountRef} 
        className="w-full h-screen fixed top-0 left-0 -z-[9999]"
      />

      <div className="w-full h-full z-0 flex flex-col justify-around pt-48">
        <div className="pl-10">
          <p className="text-2xl">Welcome to</p>
          <h1 className="text-5xl font-extrabold">SEDS ANTARIKSH</h1>
        </div>
        <div className="pl-10 flex items-center align-middle">
          <Link
            href={"/about"}
            className="group relative p-4 border-2 border-white flex justify-center items-center bg-transparent text-white transition-all duration-300 hover:px-6 hover:bg-white hover:text-black overflow-hidden w-40"
          >
            <div className="flex items-center justify-center relative w-full">
              <span className="transition-all duration-300 group-hover:translate-x-[-8px]">
                Learn More
              </span>
              <span className="absolute left-full opacity-0 group-hover:opacity-100 group-hover:translate-x-[-10px] translate-x-[-20px] transition-all duration-300">
                &#8599;
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
