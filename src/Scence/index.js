import * as THREE from "three";
import { useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Geometry, Base, Subtraction, Addition } from "@react-three/csg";
import Environment from "../Environment";

// Geometry definitions
const geometries = {
  box: new THREE.BoxGeometry(),
  // cyl: new THREE.CylinderGeometry(1, 1, 2, 20),
  // tri: new THREE.CylinderGeometry(1, 1, 2, 3),
};

// Constants
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

// Geometry cache
const geometryCache = {};

function getGeometry(name, scale) {
  const key = `${name}_${scale.join("_")}`;
  if (!geometryCache[key]) {
    const geometry = geometries[name].clone();
    geometry.scale(...scale);
    geometry.computeVertexNormals();
    geometryCache[key] = geometry;
  }
  return geometryCache[key];
}


export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [-150, 100, 150], fov: 50 }}>
      <ambientLight />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.5}
        shadow-mapSize={1024}
        castShadow
      />
      <directionalLight
        position={[-5, 5, 5]}
        intensity={0.1}
        shadow-mapSize={128}
        castShadow
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.1}
        shadow-mapSize={128}
        castShadow
      />
      <directionalLight
        position={[0, 5, 0]}
        intensity={0.1}
        shadow-mapSize={128}
        castShadow
      />
      <Cabinet />
      {/* <Environment /> */}

      <OrbitControls makeDefault />
    </Canvas>
  );
}

function Cabinet(props) {
  const csg = useRef();
  return (
    <group>
      <mesh receiveShadow castShadow {...props}>
        <Geometry ref={csg} computeVertexNormals>
          <Base
            name="base"
            geometry={getGeometry("box", [
              cabinetWidth,
              cabinetHeight,
              cabinetDepth,
            ])}
          />
          <Subtraction
            name="cavity"
            geometry={getGeometry("box", [
              cabinetWidth - materialThickness * 2,
              cabinetHeight - materialThickness * 2,
              cabinetDepth,
            ])}
          />
          <BackPanel />
          <Drawers />
          <Rails />
        </Geometry>
        <meshStandardMaterial envMapIntensity={0.25} />
      </mesh>
    </group>
  );
}

const BackPanel = (props) => {
  return (
    <Geometry>
      <Base
        geometry={getGeometry("box", [
          cabinetWidth,
          cabinetHeight,
          materialThickness,
        ])}
        position={[0, 0, -(cabinetDepth / 2 + materialThickness / 2)]}
      />
    </Geometry>
  );
};

const Drawers = () => {
  let drawerPosts = [];
  for (let i = 0; i < numOfDrawer; i++) {
    drawerPosts.push(
      firstDrawerPost -
        drawerHeightOffset -
        drawerHeight * i -
        clearance * i -
        railHeight * i
    );
  }
  return drawerPosts.map((x, index) => {
    return <Drawer drawerXPost={x} key={index} />;
  });
};

const Drawer = ({ drawerXPost }) => {
  return (
    <Addition>
      <Geometry>
        <Base
          geometry={getGeometry("box", [
            drawerWidth,
            drawerHeight,
            drawerDepth,
          ])}
          position={[0, -drawerXPost, 0]}
        />
        <Subtraction
          name="cavity"
          geometry={getGeometry("box", [
            drawerWidth - materialThickness * 2,
            drawerHeight - materialThickness,
            drawerDepth - materialThickness * 2,
          ])}
          position={[0, -drawerXPost + materialThickness, 0]}
        />
      </Geometry>
    </Addition>
  );
};

const Rails = () => {
  let railPosts = [];
  for (let i = 1; i < numOfDrawer; i++) {
    railPosts.push(
      firstDrawerPost -
        drawerHeight * i -
        clearance * i -
        railHeight * i +
        railHeightOffset
    );
  }
  return railPosts.map((x, index) => {
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
          geometry={getGeometry("box", [
            railWidth,
            railHeight,
            cabinetDepth - railDepthOffset,
          ])}
          position={[-railX, -drawerXPost, -railZ]}
        />
      </Geometry>
      <Geometry>
        <Base
          name="rail2"
          geometry={getGeometry("box", [
            railWidth,
            railHeight,
            cabinetDepth - railDepthOffset,
          ])}
          position={[railX, -drawerXPost, -railZ]}
        />
      </Geometry>
    </>
  );
};