import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface Viewer3DProps {
  geometry?: THREE.BufferGeometry;
  pressureData?: number[];
  showGrid?: boolean;
  showStreamlines?: boolean;
}

function GeometryMesh({ geometry, pressureData }: { geometry?: THREE.BufferGeometry; pressureData?: number[] }) {
  if (!geometry) return null;

  // Create color attribute from pressure data
  const colors = new Float32Array((geometry.attributes.position.count) * 3);
  if (pressureData && pressureData.length > 0) {
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const pressure = pressureData[i] || 0;
      // Map pressure to color (blue = low pressure, red = high pressure)
      const t = Math.max(0, Math.min(1, (pressure + 1) / 2));
      colors[i * 3] = t; // R
      colors[i * 3 + 1] = 0.3; // G
      colors[i * 3 + 2] = 1 - t; // B
    }
  } else {
    // Default gray color
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      colors[i * 3] = 0.7;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.7;
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Viewer3D({ geometry, pressureData, showGrid = true }: Viewer3DProps) {
  return (
    <div className="w-full h-full bg-background">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* Grid */}
        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />
        )}
        
        {/* 3D Geometry */}
        <Suspense fallback={null}>
          <GeometryMesh geometry={geometry} pressureData={pressureData} />
        </Suspense>
      </Canvas>
    </div>
  );
}
