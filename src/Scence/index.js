import * as THREE from "three";
import { useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  Effects,
  OrbitControls,
  PivotControls,
  useFBO,
} from "@react-three/drei";
import {
  Geometry,
  Base,
  Subtraction,
  Addition,
  ReverseSubtraction,
} from "@react-three/csg";
import Environment from "../Environment";

const box = new THREE.BoxGeometry();
// const cyl = new THREE.CylinderGeometry(1, 1, 2, 20)
// const tri = new THREE.CylinderGeometry(1, 1, 2, 3)

const cabinetWidth = 35;
const cabinetHeight = 70;
const cabinetDepth = 30;
const materialThickness = 1.2;
const numOfDrawer = 3;
const clearance = 0.2;

const drawerWidth = cabinetWidth - materialThickness * 2 - clearance * 2;
const drawerHeight =
  (cabinetHeight - materialThickness * 2) / numOfDrawer - clearance;
const drawerDepth = cabinetDepth;
const drawerHeightOffset = drawerHeight / 2;
const firstDrawerPost = (cabinetHeight - materialThickness * 2) / 2;

export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [-150, 100, 150], fov: 25 }}>
      <color attach="background" args={["skyblue"]} />
      <Cabinet />
      <Environment />
      <OrbitControls makeDefault />
    </Canvas>
  );
}

function Cabinet(props) {
  const csg = useRef();
  return (
    <mesh receiveShadow castShadow {...props}>
      <Geometry ref={csg} computeVertexNormals>
        <Base
          name="base"
          geometry={box}
          scale={[cabinetWidth, cabinetHeight, cabinetDepth]}
        />
        <Subtraction
          name="cavity"
          geometry={box}
          scale={[
            cabinetWidth - materialThickness * 2,
            cabinetHeight - materialThickness * 2,
            cabinetDepth,
          ]}
        />
        <BackPanel />
        <Drawers />
      </Geometry>
      <meshStandardMaterial envMapIntensity={0.25} />
    </mesh>
  );
}

const BackPanel = (props) => {
  return (
    <Geometry>
      <Base
        geometry={box}
        scale={[cabinetWidth, cabinetHeight, materialThickness]}
        position={[0, 0, -(cabinetDepth / 2 + materialThickness / 2)]}
      />
    </Geometry>
  );
};

const Drawers = () => {
  let tmpArg = [];
  for (let i = 0; i < numOfDrawer; i++) {
    tmpArg.push(firstDrawerPost - drawerHeightOffset - drawerHeight * i - clearance * i);
  }

  return tmpArg.map((x, index) => {
    return <Drawer drawerXPost={x} key={index} />;
  });
};

const Drawer = ({ drawerXPost }) => {
  return (
    <Addition>
      <Geometry>
        <Base
          geometry={box}
          scale={[drawerWidth, drawerHeight, drawerDepth]}
          position={[0, -drawerXPost, 0]}
        />
        <Subtraction
          name="cavity"
          geometry={box}
          scale={[
            drawerWidth - materialThickness * 2,
            drawerHeight - materialThickness,
            drawerDepth - materialThickness * 2,
          ]}
          position={[0, -drawerXPost + materialThickness, 0]}
        />
      </Geometry>
    </Addition>
  );
};
