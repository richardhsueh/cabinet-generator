import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BoxGeometry, CatmullRomCurve3, MeshBasicMaterial, TubeGeometry, Vector3 } from "three";
import { OrbitControls } from "@react-three/drei";

const Cabinet = ({
  cabinetWidth,
  cabinetHeight,
  cabinetDepth,
  materialThickness,
  numOfDrawer,
  clearance,
  railWidth,
  railHeight,
  railDepthOffset,
  railHeightOffset,
}) => {
  const cabinetRef = useRef();
  const drawerRefs = useRef([]);
  const moebiusRef = useRef();

  const [cabinetGeometry, setCabinetGeometry] = useState(
    () => new BoxGeometry(cabinetWidth, cabinetHeight, cabinetDepth)
  );
  const [drawerGeometry, setDrawerGeometry] = useState(
    () =>
      new BoxGeometry(
        cabinetWidth - 2 * materialThickness,
        cabinetHeight / numOfDrawer,
        cabinetDepth - 2 * materialThickness
      )
  );
  const [moebiusGeometry, setMoebiusGeometry] = useState(
    () => new TubeGeometry()
  );

//   useFrame(() => {
//     // Animate the Möbius effect
//     moebiusRef.current.rotation.x += 0.01;
//   });

  useFrame(() => {
    // Update the Möbius effect geometry
    const points = [];
    for (let i = 0; i < numOfDrawer; i++) {
      const drawer = drawerRefs.current[i];
      const point = new Vector3(
        drawer.position.x + cabinetWidth / 2,
        drawer.position.y + cabinetHeight / 2,
        drawer.position.z + cabinetDepth / 2
      );
      points.push(point);
    }
    points.push(
      new Vector3(cabinetWidth / 2, cabinetHeight / 2, cabinetDepth / 2)
    );
    const tube = new TubeGeometry(new CatmullRomCurve3(points), 64, 1, 8);
    setMoebiusGeometry(tube);
  });

  return (
    <group ref={cabinetRef}>
      {/* Cabinet */}
      <mesh
        geometry={cabinetGeometry}
        material={new MeshBasicMaterial({ color: 0xffffff })}
      />
      {/* Drawers */}
      {Array.from({ length: numOfDrawer }, (_, i) => (
        <mesh
          key={i}
          ref={(ref) => (drawerRefs.current[i] = ref)}
          geometry={drawerGeometry}
          material={new MeshBasicMaterial({ color: 0xffffff })}
          position={[0, -i * (cabinetHeight / numOfDrawer), 0]}
        />
      ))}
      {/* Möbius effect */}
      <mesh
        ref={moebiusRef}
        geometry={moebiusGeometry}
        material={new MeshBasicMaterial({ color: 0x000000 })}
      />
    </group>
  );
};

const App = () => {
  const cabinetWidth = 35;
  const cabinetHeight = 70;
  const cabinetDepth = 30;
  const materialThickness = 1.2;
  const numOfDrawer = 9;
  const clearance = 0.2;

  const railWidth = 1.2;
  const railHeight = 2.4;
  const railDepthOffset = 2.4;
  const railHeightOffset = railHeight / 2;

  return (
    <Canvas>
      <ambientLight />
      <directionalLight position={[10, 10, 10]} />
      <Cabinet
        cabinetWidth={cabinetWidth}
        cabinetHeight={cabinetHeight}
        cabinetDepth={cabinetDepth}
        materialThickness={materialThickness}
        numOfDrawer={numOfDrawer}
        clearance={clearance}
        railWidth={railWidth}
        railHeight={railHeight}
        railDepthOffset={railDepthOffset}
        railHeightOffset={railHeightOffset}
      />
      <OrbitControls makeDefault />
    </Canvas>
  );
};

export default App
