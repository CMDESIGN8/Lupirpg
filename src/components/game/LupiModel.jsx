import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";

export default function LupiModel(props) {
  const group = useRef();
  const { scene } = useGLTF("/assets/lupi.glb");

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
}
