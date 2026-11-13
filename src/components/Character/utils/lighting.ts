import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
import { gsap } from "gsap";

const setLighting = (scene: THREE.Scene) => {
  const directionalLight = new THREE.DirectionalLight(0xc7a9ff, 0);
  directionalLight.intensity = 0;
  directionalLight.position.set(-0.47, -0.32, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xc2a4ff, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // Studio Warm Key Light (Main softbox light)
  const frontKeyLight = new THREE.DirectionalLight(0xfff6ec, 0);
  frontKeyLight.position.set(3.5, 12, 18);
  frontKeyLight.castShadow = true;
  frontKeyLight.shadow.mapSize.width = 1024;
  frontKeyLight.shadow.mapSize.height = 1024;
  frontKeyLight.shadow.bias = -0.0004;
  scene.add(frontKeyLight);

  // Soft Cool Fill Light (lifts dark shadows without flattening depth)
  const fillLight = new THREE.DirectionalLight(0xdbeafe, 0);
  fillLight.position.set(-6, 10, 14);
  scene.add(fillLight);

  // Crisp Rim / Backlight (separates hair/cap/shoulders from dark background)
  const rimLight = new THREE.DirectionalLight(0xe2e8f0, 0);
  rimLight.position.set(0, 16, -10);
  scene.add(rimLight);

  new RGBELoader()
    .setPath("/models/")
    .load("char_enviorment.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.environmentIntensity = 0;
      scene.environmentRotation.set(5.76, 85.85, 1);
    });

  function setPointLight(screenLight: THREE.Object3D | null) {
    if (!(screenLight instanceof THREE.Mesh)) {
      pointLight.intensity = 0;
      return;
    }

    const material = screenLight.material;
    if (Array.isArray(material) || !(material instanceof THREE.MeshStandardMaterial)) {
      pointLight.intensity = 0;
      return;
    }

    if (material.opacity > 0.9) {
      pointLight.intensity = material.emissiveIntensity * 20;
    } else {
      pointLight.intensity = 0;
    }
  }
  const duration = 2;
  const ease = "power2.inOut";
  function turnOnLights() {
    gsap.to(scene, {
      environmentIntensity: 0.72,
      duration: duration,
      ease: ease,
    });
    gsap.to(directionalLight, {
      intensity: 0.8,
      duration: duration,
      ease: ease,
    });
    gsap.to(frontKeyLight, {
      intensity: 1.5,
      duration: duration,
      ease: ease,
    });
    gsap.to(fillLight, {
      intensity: 0.65,
      duration: duration,
      ease: ease,
    });
    gsap.to(rimLight, {
      intensity: 1.8,
      duration: duration,
      ease: ease,
    });

    const rimElement = document.querySelector(".character-rim");
    if (rimElement) {
      gsap.to(rimElement, {
        y: "55%",
        opacity: 1,
        delay: 0.2,
        duration: 2,
      });
    }
  }

  return { setPointLight, turnOnLights };
};

export default setLighting;
