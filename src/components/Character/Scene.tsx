import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/useLoading";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../utils/progress";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const { isLoading, setLoading } = useLoading();
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const canvasElement = canvasDiv.current;
    if (!canvasElement) {
      return;
    }

    let cancelled = false;
    const rect = canvasElement.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;
    const scene = sceneRef.current;
    scene.clear();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    canvasElement.innerHTML = "";
    canvasElement.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.z = 10;
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let loadedCharacter: THREE.Object3D | null = null;
    let introAnimation: (() => void) | null = null;
    let introReady = false;
    let introDismissed = !isLoadingRef.current;
    let introPlayed = false;

    const startIntroWhenReady = () => {
      if (!introReady || !introDismissed || introPlayed || !introAnimation) {
        return;
      }

      introPlayed = true;
      clock.start();
      introAnimation();
    };
    const onIntroDismissed = () => {
      introDismissed = true;
      startIntroWhenReady();
    };
    window.addEventListener("portfolio-intro-dismissed", onIntroDismissed);

    const clock = new THREE.Clock();

    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    loadCharacter().then((gltf) => {
      if (cancelled) {
        return;
      }

      if (!gltf) {
        setLoading(100);
        return;
      }

      const animations = setAnimations(gltf);
      introAnimation = animations.startIntro;
      if (hoverDivRef.current) {
        animations.hover(gltf, hoverDivRef.current);
      }
      mixer = animations.mixer;
      const loadedModel = gltf.scene;
      loadedCharacter = loadedModel;
      scene.add(loadedModel);
      headBone = loadedModel.getObjectByName("spine006") || null;
      screenLight = loadedModel.getObjectByName("screenlight") || null;
      progress.loaded().then(() => {
        if (!cancelled) {
          light.turnOnLights();
          introReady = true;
          startIntroWhenReady();
        }
      });
    });

    const mouse = { x: 0, y: 0 };
    const interpolation = { x: 0.1, y: 0.2 };

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => {
        mouse.x = x;
        mouse.y = y;
      });
    };
    let debounce: number | undefined;
    const onTouchStart = (event: TouchEvent) => {
      const element = event.target as HTMLElement;
      debounce = window.setTimeout(() => {
        element?.addEventListener("touchmove", (e: TouchEvent) =>
          handleTouchMove(e, (x, y) => {
            mouse.x = x;
            mouse.y = y;
          })
        );
      }, 200);
    };

    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse.x = x;
        mouse.y = y;
        interpolation.x = interpolationX;
        interpolation.y = interpolationY;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart);
      landingDiv.addEventListener("touchend", onTouchEnd);
    }

    const handleResizeListener = () => {
      if (loadedCharacter) {
        handleResize(renderer, camera, canvasDiv, loadedCharacter);
      }
    };
    window.addEventListener("resize", handleResizeListener);

    const animate = () => {
      if (cancelled) {
        return;
      }

      requestAnimationFrame(animate);
      if (!introDismissed) {
        return;
      }

      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp
        );
        light.setPointLight(screenLight);
      }
      const delta = Math.min(clock.getDelta(), 0.05);
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      scene.clear();
      renderer.dispose();
      window.removeEventListener("resize", handleResizeListener);
      window.removeEventListener("portfolio-intro-dismissed", onIntroDismissed);
      document.removeEventListener("mousemove", onMouseMove);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }
      if (canvasElement) {
        canvasElement.innerHTML = "";
      }
    };
  }, [setLoading]);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
