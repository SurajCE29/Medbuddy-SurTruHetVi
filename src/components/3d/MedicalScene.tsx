import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FloatingObject = ({ position, color, speed, distort }: { position: [number, number, number], color: string, speed: number, distort: number }) => {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.position.y = position[1] + Math.sin(t * speed) * 0.5;
  });

  return (
    <Float speed={speed} rotationIntensity={2} floatIntensity={2}>
      <Sphere ref={mesh} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          speed={speed}
          distort={distort}
          radius={1}
        />
      </Sphere>
    </Float>
  );
};

const DNAHelix = () => {
  const group = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    group.current.rotation.y += 0.01;
  });

  const spheres = [];
  for (let i = 0; i < 20; i++) {
    const y = (i - 10) * 0.5;
    const angle = i * 0.5;
    const x1 = Math.cos(angle) * 2;
    const z1 = Math.sin(angle) * 2;
    const x2 = Math.cos(angle + Math.PI) * 2;
    const z2 = Math.sin(angle + Math.PI) * 2;
    
    spheres.push(
      <group key={i}>
        <mesh position={[x1, y, z1]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#2563EB" emissive="#2563EB" emissiveIntensity={1} />
        </mesh>
        <mesh position={[x2, y, z2]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, y, 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[4, 0.05, 0.05]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      </group>
    );
  }

  return <group ref={group} position={[10, 0, -10]}>{spheres}</group>;
};

export const MedicalScene = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#2563EB" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#22C55E" />
        
        <FloatingObject position={[-8, 5, -5]} color="#2563EB" speed={1.5} distort={0.4} />
        <FloatingObject position={[8, -5, -8]} color="#22C55E" speed={2} distort={0.3} />
        <FloatingObject position={[-5, -8, -10]} color="#2563EB" speed={1.2} distort={0.5} />
        
        <DNAHelix />
        
        <fog attach="fog" args={['#FFFFFF', 10, 50]} />
      </Canvas>
    </div>
  );
};
