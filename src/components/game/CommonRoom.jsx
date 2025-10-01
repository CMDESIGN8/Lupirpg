// CommonRoom.jsx - Componente 3D solamente
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import LupiModel from "./LupiModel";
import "../styles/CommonRoom3D.css";

export default function CommonRoom() {
  return (
    <div className="commonroom-3d-container">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        {/* Luces */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <Suspense fallback={<Html><div className="loading-3d">Cargando mundo 3D...</div></Html>}>
          {/* Nuestro modelo Lupi */}
          <LupiModel position={[0, 0, 0]} />
          {/* Entorno HDRI básico */}
          <Environment preset="city" />
        </Suspense>

        {/* Cámara interactiva */}
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}