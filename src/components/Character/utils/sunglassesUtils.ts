import * as THREE from "three";

/**
 * Creates sleek, modern Wayfarer-style 3D Black Sunglasses with glossy acetate frames,
 * dark tinted reflective lenses, silver corner rivets, and temple arms.
 */
export function createPrinceSunglasses(): THREE.Group {
  const glassesGroup = new THREE.Group();
  glassesGroup.name = "PrinceSunglasses";

  // Glossy black acetate frame material (matching Prince's photo)
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0c0a0e"),
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });

  // Dark tinted reflective glass lens material
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#070608"),
    roughness: 0.04,
    metalness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  // Metallic silver corner rivet pins (signature Wayfarer detail)
  const rivetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f1f5f9"),
    metalness: 0.95,
    roughness: 0.15,
  });

  const eyeSpacing = 0.34;
  const rimWidth = 0.52;
  const rimHeight = 0.34;

  // Build Left and Right Rims & Lenses
  [-eyeSpacing, eyeSpacing].forEach((xOffset) => {
    // Wayfarer contoured rim shape
    const shape = new THREE.Shape();
    const halfW = rimWidth / 2;
    const halfH = rimHeight / 2;

    shape.moveTo(-halfW, -halfH + 0.04);
    shape.quadraticCurveTo(-halfW, -halfH, -halfW + 0.06, -halfH);
    shape.lineTo(halfW - 0.06, -halfH);
    shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + 0.04);
    shape.lineTo(halfW + 0.03, halfH - 0.04);
    shape.quadraticCurveTo(halfW + 0.03, halfH, halfW - 0.04, halfH);
    shape.lineTo(-halfW + 0.04, halfH);
    shape.quadraticCurveTo(-halfW - 0.03, halfH, -halfW - 0.03, halfH - 0.04);
    shape.closePath();

    const rimGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    });
    const rimMesh = new THREE.Mesh(rimGeo, frameMat);
    rimMesh.position.set(xOffset, 0, 0);
    rimMesh.castShadow = true;
    glassesGroup.add(rimMesh);

    // Dark tinted lens inside rim
    const lensGeo = new THREE.PlaneGeometry(
      rimWidth - 0.06,
      rimHeight - 0.06
    );
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(xOffset, 0, 0.036);
    glassesGroup.add(lensMesh);

    // Silver corner rivet dot
    const rivetGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 8);
    rivetGeo.rotateX(Math.PI / 2);
    const rivet = new THREE.Mesh(rivetGeo, rivetMat);
    const rivetX =
      xOffset < 0
        ? xOffset - halfW - 0.005
        : xOffset + halfW + 0.005;
    rivet.position.set(rivetX, halfH - 0.045, 0.04);
    glassesGroup.add(rivet);
  });

  // Solid Center Bridge over the nose
  const bridgeGeo = new THREE.BoxGeometry(0.18, 0.05, 0.032);
  const bridge = new THREE.Mesh(bridgeGeo, frameMat);
  bridge.position.set(0, 0.08, 0.018);
  glassesGroup.add(bridge);

  // Left Temple Arm
  const armGeo = new THREE.BoxGeometry(0.024, 0.042, 0.95);
  armGeo.translate(0, 0, -0.475);
  const leftArm = new THREE.Mesh(armGeo, frameMat);
  leftArm.position.set(-0.62, 0.08, 0.02);
  leftArm.rotation.y = -0.12;
  glassesGroup.add(leftArm);

  // Right Temple Arm
  const rightArm = new THREE.Mesh(armGeo, frameMat);
  rightArm.position.set(0.62, 0.08, 0.02);
  rightArm.rotation.y = 0.12;
  glassesGroup.add(rightArm);

  return glassesGroup;
}

