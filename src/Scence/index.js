import * as THREE from "three";
import { useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Geometry, Base, Subtraction, Addition } from "@react-three/csg";
import Environment from "../Environment";

const box = new THREE.BoxGeometry();
// const cyl = new THREE.CylinderGeometry(1, 1, 2, 20)
// const tri = new THREE.CylinderGeometry(1, 1, 2, 3)

const cabinetWidth = 35;
const cabinetHeight = 70;
const cabinetDepth = 30;
const materialThickness = 1.2;
const numOfDrawer = 4;
const clearance = 0.2;

const railWidth = 1.2;
const railHeight = 2.4;
const railDepthOffset = 2.4;
const railHeightOffset = railHeight / 2;

const drawerWidth = cabinetWidth - materialThickness * 2 - clearance * 2;
const drawerHeight =
  (cabinetHeight - materialThickness * 2 - railHeight * (numOfDrawer - 1)) /
    numOfDrawer -
  clearance;
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
        <Rails />
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
    tmpArg.push(
      firstDrawerPost -
        drawerHeightOffset -
        drawerHeight * i -
        clearance * i -
        railHeight * i
    );
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

const Rails = () => {
  let tmpArg = [];
  for (let i = 1; i < numOfDrawer; i++) {
    tmpArg.push(
      firstDrawerPost -
        drawerHeight * i -
        clearance * i -
        railHeight * i +
        railHeightOffset
    );
  }
  return tmpArg.map((x, index) => {
    return <Rail drawerXPost={x} key={index} />;
  });
};

const Rail = ({ drawerXPost }) => {
  const railX = (cabinetWidth - materialThickness) / 2 - railWidth;
  const railZ = railDepthOffset / 2;

  return (
    <>
      <Geometry>
        <Base
          name="rail"
          geometry={box}
          scale={[railWidth, railHeight, cabinetDepth - railDepthOffset]}
          position={[-railX, -drawerXPost, -railZ]}
        />
      </Geometry>
      <Geometry>
        <Base
          name="rail2"
          geometry={box}
          scale={[railWidth, railHeight, cabinetDepth - railDepthOffset]}
          position={[railX, -drawerXPost, -railZ]}
        />
      </Geometry>
    </>
  );
};
