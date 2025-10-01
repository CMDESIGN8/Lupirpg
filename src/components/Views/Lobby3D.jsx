// Lobby3D.jsx
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import './Lobby3D.css';

// Componente para cada jugador en 3D
function PlayerAvatar({ player, position, onClick }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Movimiento flotante suave
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={player.color || '#2E8B57'} 
          emissive={player.color || '#2E8B57'}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Nombre del jugador */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {player.name}
      </Text>

      {/* Indicador deporte */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
      >
        {getSportEmoji(player.sport)}
      </Text>
    </group>
  );
}

function getSportEmoji(sport) {
  const emojis = {
    'fútbol': '⚽',
    'baloncesto': '🏀',
    'tenis': '🎾',
    'natación': '🏊',
    'atletismo': '🏃'
  };
  return emojis[sport] || '🏆';
}

// Ambiente del lobby 3D
function LobbyEnvironment() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a4a5f" />
      </mesh>

      {/* Objetos decorativos */}
      <Float speed={2} rotationIntensity={0.5}>
        <mesh position={[-3, 0, -3]}>
          <torusGeometry args={[0.5, 0.2, 16, 32]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1}>
        <mesh position={[3, 0, -3]}>
          <coneGeometry args={[0.4, 1, 8]} />
          <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.3} />
        </mesh>
      </Float>
    </>
  );
}

export default function Lobby3D({ players, currentUser, onPlayerInteract }) {
  return (
    <div className="lobby-3d-container">
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <LobbyEnvironment />
        
        <Suspense fallback={null}>
          <Environment preset="night" />
          
          {/* Jugadores en el lobby */}
          {players.map((player, index) => {
            const angle = (index / players.length) * Math.PI * 2;
            const radius = 4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            return (
              <PlayerAvatar
                key={player.id}
                player={player}
                position={[x, 0, z]}
                onClick={() => onPlayerInteract(player.id)}
              />
            );
          })}

          {/* Jugador actual en el centro */}
          {currentUser && (
            <PlayerAvatar
              player={currentUser}
              position={[0, 0, 0]}
              onClick={() => {}}
            />
          )}
        </Suspense>

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
}