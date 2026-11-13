import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

function sculptFaceLips(
  mesh: THREE.SkinnedMesh,
  skinMaterial: THREE.MeshPhysicalMaterial
): void {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const position = geometry.getAttribute("position");
  if (!position || mesh.userData.lipsSculpted) return;

  const inverseBindMatrix = new THREE.Matrix4().fromArray([
    1, 0, 0, 0,
    0, 0.9952706098556519, -0.09714250266551971, 0,
    0, 0.09714271128177643, 0.9952704906463623, 0,
    0, -12.047183990478516, 1.4554466009140015, 1,
  ]);
  const bindMatrix = inverseBindMatrix.clone().invert();
  const index = geometry.getIndex();
  const joints = geometry.getAttribute("skinIndex");
  const weights = geometry.getAttribute("skinWeight");
  if (!index || !joints || !weights) {
  throw new Error("The character face mesh is missing indexed skin data.");
  }

  const headPositions = Array.from({ length: position.count }, (_, i) =>
  new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(inverseBindMatrix)
  );
  const frontTriangles: Array<[number, number, number]> = [];
  for (let i = 0; i < index.count; i += 3) {
  const a = index.getX(i);
  const b = index.getX(i + 1);
  const c = index.getX(i + 2);
  const pa = headPositions[a];
  const pb = headPositions[b];
  const pc = headPositions[c];
  if (
    pa.z > 0.9 &&
    pb.z > 0.9 &&
    pc.z > 0.9 &&
    Math.abs((pa.x + pb.x + pc.x) / 3) < 0.65 &&
    (pa.y + pb.y + pc.y) / 3 > 0.42 &&
    (pa.y + pb.y + pc.y) / 3 < 0.78
  ) {
    frontTriangles.push([a, b, c]);
  }
  }

  const sampleFace = (x: number, y: number) => {
  let best:
    | {
        z: number;
        barycentric: [number, number, number];
        triangle: [number, number, number];
      }
    | undefined;

  for (const triangle of frontTriangles) {
    const [a, b, c] = triangle;
    const pa = headPositions[a];
    const pb = headPositions[b];
    const pc = headPositions[c];
    const denominator =
      (pb.y - pc.y) * (pa.x - pc.x) +
      (pc.x - pb.x) * (pa.y - pc.y);
    if (Math.abs(denominator) < 1e-8) continue;

    const u =
      ((pb.y - pc.y) * (x - pc.x) + (pc.x - pb.x) * (y - pc.y)) /
      denominator;
    const v =
      ((pc.y - pa.y) * (x - pc.x) + (pa.x - pc.x) * (y - pc.y)) /
      denominator;
    const w = 1 - u - v;
    if (u < -1e-4 || v < -1e-4 || w < -1e-4) continue;

    const z = u * pa.z + v * pb.z + w * pc.z;
    if (!best || z > best.z) best = { z, barycentric: [u, v, w], triangle };
  }

  if (!best) {
    let nearestVertex = -1;
    let nearestDistance = Infinity;
    for (const [a, b, c] of frontTriangles) {
      for (const vertexIndex of [a, b, c]) {
        const point = headPositions[vertexIndex];
        const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestVertex = vertexIndex;
        }
      }
    }
    if (nearestVertex < 0) return null;
    best = {
      z: headPositions[nearestVertex].z,
      barycentric: [1, 0, 0],
      triangle: [nearestVertex, nearestVertex, nearestVertex],
    };
  }

  const jointWeights = new Map<number, number>();
  best.triangle.forEach((vertexIndex, vertexNumber) => {
    const jointAttribute = joints as THREE.BufferAttribute;
    const weightAttribute = weights as THREE.BufferAttribute;
    for (let j = 0; j < 4; j++) {
      const joint = jointAttribute.getComponent(vertexIndex, j);
      const weight =
        weightAttribute.getComponent(vertexIndex, j) *
        best!.barycentric[vertexNumber];
      jointWeights.set(joint, (jointWeights.get(joint) ?? 0) + weight);
    }
  });

  const strongestJoints = [...jointWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const totalWeight = strongestJoints.reduce((sum, [, weight]) => sum + weight, 0);
  const skinIndices = new Uint16Array(4);
  const skinWeights = new Float32Array(4);
  strongestJoints.forEach(([joint, weight], i) => {
    skinIndices[i] = joint;
    skinWeights[i] = weight / totalWeight;
  });

  return { z: best.z, skinIndices, skinWeights };
  };

  const makeLip = (
  upper: boolean,
  lipColor: THREE.Color,
  segments = 128,
  rows = 32
  ) => {
  const width = 0.4;
  const vertices: number[] = [];
  const colors: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const surfacePoints: Array<[number, number, number]> = [];
  const indices: number[] = [];
  const skinColor = new THREE.Color("#b98269");
  const vertex = new THREE.Vector3();
  const color = new THREE.Color();

  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let column = 0; column <= segments; column++) {
      const across = (column / segments) * 2 - 1;
      const x = across * width;
      const nx = Math.abs(across);
      const sideFade = Math.pow(Math.max(0, 1 - nx * nx), 0.65);
      const seamY =
        0.575 +
        0.04 * nx * nx +
        0.018 * across * nx * nx;
      const cupidBow =
        0.01 * Math.exp(-Math.pow((Math.abs(x) - 0.09) / 0.05, 2)) -
        0.008 * Math.exp(-Math.pow(x / 0.045, 2));
      const seam = seamY;
      const lipHeight = upper
        ? 0.09 * sideFade + cupidBow
        : 0.135 * sideFade;
      const y = upper
        ? seam + lipHeight * (1 - t)
        : seam - lipHeight * (1 - t);
      const face = sampleFace(x, y);

      if (!face) {
        throw new Error(`Could not map lip geometry to the face at (${x}, ${y}).`);
      }

      const volume = Math.pow(Math.sin(Math.PI * t), 0.72) * sideFade;
      surfacePoints.push([x, y, face.z]);
      vertex.set(
        x,
        y,
        face.z + 0.001 + volume * (upper ? 0.09 : 0.12)
      );
      vertex.applyMatrix4(bindMatrix);
      vertices.push(vertex.x, vertex.y, vertex.z);

      const lipBlend = Math.pow(Math.sin(Math.PI * t), 0.65) * sideFade * 0.58;
      const seamBlend =
        Math.exp(-Math.pow(t / 0.075, 2)) * sideFade * 0.12;
      color.copy(skinColor).lerp(lipColor, lipBlend + seamBlend);
      colors.push(color.r, color.g, color.b);
      skinIndices.push(...face.skinIndices);
      skinWeights.push(...face.skinWeights);
    }
  }

  const frontVertexCount = vertices.length / 3;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < segments; column++) {
      const a = row * (segments + 1) + column;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;
      if (upper) indices.push(a, b, c, b, d, c);
      else indices.push(a, c, b, b, c, d);
    }
  }

  const frontIndices = indices.slice();
  for (let i = 0; i < frontVertexCount; i++) {
    const [x, y, z] = surfacePoints[i];
    vertex.set(x, y, z - 0.025).applyMatrix4(bindMatrix);
    vertices.push(vertex.x, vertex.y, vertex.z);
    colors.push(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
    skinIndices.push(
      skinIndices[i * 4],
      skinIndices[i * 4 + 1],
      skinIndices[i * 4 + 2],
      skinIndices[i * 4 + 3]
    );
    skinWeights.push(
      skinWeights[i * 4],
      skinWeights[i * 4 + 1],
      skinWeights[i * 4 + 2],
      skinWeights[i * 4 + 3]
    );
  }

  for (let i = 0; i < frontIndices.length; i += 3) {
    indices.push(
      frontIndices[i] + frontVertexCount,
      frontIndices[i + 2] + frontVertexCount,
      frontIndices[i + 1] + frontVertexCount
    );
  }

  const boundary: number[] = [];
  for (let column = 0; column <= segments; column++) {
    boundary.push(column);
  }
  for (let row = 1; row <= rows; row++) {
    boundary.push(row * (segments + 1) + segments);
  }
  for (let column = segments - 1; column >= 0; column--) {
    boundary.push(rows * (segments + 1) + column);
  }
  for (let row = rows - 1; row > 0; row--) {
    boundary.push(row * (segments + 1));
  }
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i];
    const b = boundary[(i + 1) % boundary.length];
    const backA = a + frontVertexCount;
    const backB = b + frontVertexCount;
    indices.push(a, backA, b, b, backA, backB);
  }

  const lipGeometry = new THREE.BufferGeometry();
  lipGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  lipGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
  lipGeometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndices, 4)
  );
  lipGeometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4)
  );
  lipGeometry.setIndex(indices);
  lipGeometry.computeVertexNormals();

  const lipMaterial = skinMaterial.clone();
  lipMaterial.color.set("#ffffff");
  lipMaterial.vertexColors = true;
  lipMaterial.roughness = skinMaterial.roughness;
  lipMaterial.clearcoat = skinMaterial.clearcoat;
  lipMaterial.clearcoatRoughness = skinMaterial.clearcoatRoughness;
  lipMaterial.sheen = skinMaterial.sheen;
  lipMaterial.sheenColor.copy(skinMaterial.sheenColor);
  lipMaterial.sheenRoughness = skinMaterial.sheenRoughness;
  lipMaterial.side = THREE.DoubleSide;
  lipMaterial.needsUpdate = true;

  const lipMesh = new THREE.SkinnedMesh(lipGeometry, lipMaterial);
  lipMesh.name = upper ? "SculptedUpperLip" : "SculptedLowerLip";
  lipMesh.position.copy(mesh.position);
  lipMesh.quaternion.copy(mesh.quaternion);
  lipMesh.scale.copy(mesh.scale);
  lipMesh.bind(mesh.skeleton, mesh.bindMatrix);
  lipMesh.frustumCulled = false;
  lipMesh.renderOrder = mesh.renderOrder + 1;
  mesh.parent?.add(lipMesh);
  };

  mesh.material = skinMaterial;
  makeLip(true, new THREE.Color("#a85e54"));
  makeLip(false, new THREE.Color("#b76a60"));
  mesh.userData.lipsSculpted = true;
}

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  // Warm natural skin
  const skinMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#b98269"),
    roughness: 0.66,
    metalness: 0.0,
    clearcoat: 0.03,
    clearcoatRoughness: 0.45,
    sheen: 0.18,
    sheenColor: new THREE.Color("#d7a18a"),
    sheenRoughness: 0.82,
  });

  // Light pinstriped shirt
  const shirtCanvas = document.createElement("canvas");
  shirtCanvas.width = 512; shirtCanvas.height = 512;
  const sc = shirtCanvas.getContext("2d");
  if (sc) {
    sc.fillStyle = "#edeef2"; sc.fillRect(0, 0, 512, 512);
    sc.strokeStyle = "#d4d7e0"; sc.lineWidth = 3;
    for (let x = 0; x < 512; x += 14) {
      sc.beginPath(); sc.moveTo(x, 0); sc.lineTo(x, 512); sc.stroke();
    }
  }
  const shirtTex = new THREE.CanvasTexture(shirtCanvas);
  shirtTex.wrapS = THREE.RepeatWrapping;
  shirtTex.wrapT = THREE.RepeatWrapping;
  shirtTex.repeat.set(4, 4);

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f2f3f7"),
    roughness: 0.8,
    metalness: 0.02,
    map: shirtTex,
  });

  const pantMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1e293b"),
    roughness: 0.8,
    metalness: 0.1,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#141216"),
    roughness: 0.55,
    metalness: 0.0,
  });

  const capMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1c1c24"),
    roughness: 0.65,
    metalness: 0.08,
  });

  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0f172a"),
    roughness: 0.6,
    metalness: 0.1,
  });

  const soleMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: 0.4,
    metalness: 0.05,
  });

  const loadCharacter = async (): Promise<GLTF | null> => {
    let blobUrl: string | undefined;
    try {
      const encryptedBlob = await decryptFile(
        "/models/character.enc",
        "Character3D#@"
      );
      const modelUrl = URL.createObjectURL(new Blob([encryptedBlob]));
      blobUrl = modelUrl;

      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          modelUrl,
          async (loadedGltf) => {
            try {
              const character = loadedGltf.scene;
              await renderer.compileAsync(character, camera, scene);
              character.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const mesh = child;
                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;

                const rawName = (child.name || "").toLowerCase();
                const rawParent = (child.parent?.name || "").toLowerCase();
                const cleanName = rawName.replace(/[^a-z0-9]/g, "");
                const cleanParent = rawParent.replace(/[^a-z0-9]/g, "");

                if (
                  cleanName.startsWith("glass") ||
                  cleanName.includes("glasses") ||
                  cleanName.includes("goggle") ||
                  cleanName.includes("eyewear") ||
                  cleanName.includes("spectacle")
                ) {
                  child.visible = false;
                  return;
                }

                if (
                  cleanName.includes("plane007") ||
                  cleanName.includes("neck") ||
                  cleanName.includes("hand") ||
                  cleanName.includes("ear") ||
                  cleanName.includes("mesh002") ||
                  cleanName.includes("face") ||
                  cleanParent.includes("neck") ||
                  cleanParent.includes("hand") ||
                  cleanParent.includes("ear") ||
                  cleanParent.includes("face")
                ) {
                  if (cleanName.includes("plane007")) {
                    if (mesh instanceof THREE.SkinnedMesh) {
                      sculptFaceLips(mesh, skinMaterial);
                    } else {
                      console.error(
                        "Cannot sculpt lips because Plane.007 is not a skinned mesh."
                      );
                      mesh.material = skinMaterial;
                    }
                  } else {
                    mesh.material = skinMaterial;
                  }
                } else if (
                  cleanName.includes("shirt") ||
                  cleanName.includes("bodyshirt") ||
                  cleanParent.includes("shirt")
                ) {
                  mesh.material = shirtMaterial;
                } else if (
                  cleanName.includes("pant") ||
                  cleanName.includes("cube004") ||
                  cleanParent.includes("pant")
                ) {
                  mesh.material = pantMaterial;
                } else if (
                  cleanName.includes("hair") ||
                  cleanName.includes("eyebrow") ||
                  cleanName.includes("ironpcube3004") ||
                  cleanParent.includes("hair")
                ) {
                  mesh.material = hairMaterial;
                  mesh.visible = true;
                } else if (
                  cleanName === "cube002" ||
                  cleanParent === "cube002"
                ) {
                  mesh.material = capMaterial;
                  mesh.visible = true;
                } else if (
                  cleanName.includes("shoe") ||
                  cleanName.includes("cylinder005") ||
                  cleanParent.includes("shoe")
                ) {
                  mesh.material = shoeMaterial;
                } else if (
                  cleanName.includes("sole") ||
                  cleanName.includes("cylinder008") ||
                  cleanParent.includes("sole")
                ) {
                  mesh.material = soleMaterial;
                }
              }
              });

              setCharTimeline(character, camera);
              setAllTimeline();

              const headBone = character.getObjectByName("spine006");
              if (headBone) {
                const existingOpen = headBone.getObjectByName("OpenMouth");
                if (existingOpen) headBone.remove(existingOpen);

                const existingTeeth = headBone.getObjectByName("SmilingTeeth");
                if (existingTeeth) headBone.remove(existingTeeth);
              }

              character.getObjectByName("footR")!.position.y = 3.36;
              character.getObjectByName("footL")!.position.y = 3.36;
              resolve(loadedGltf);
            } catch (error) {
              reject(error);
            } finally {
              dracoLoader.dispose();
              URL.revokeObjectURL(modelUrl);
            }
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            dracoLoader.dispose();
            URL.revokeObjectURL(modelUrl);
            reject(error);
          }
        );
      });

      return gltf;
    } catch (err) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      dracoLoader.dispose();
      console.error(err);
      return null;
    }
  };

  return { loadCharacter };
};

export default setCharacter;
