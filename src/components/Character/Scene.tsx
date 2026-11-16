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
  const { isLoading, setIsLoading, setLoading } = useLoading();
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
    renderer.setPixelRatio(window.devicePixelRatio);
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
    let introAnimation: ((onDone: () => void) => void) | null = null;
    let introReady = false;
    let introDismissed = !isLoadingRef.current;
    let introPlayed = false;
    // While intro animation is running, block handleHeadRotation so the two
    // don't fight over spine006 (head bone) → no blinking/jitter
    let introActive = false;

    const startIntroWhenReady = () => {
      if (!introReady || !introDismissed || introPlayed || !introAnimation) {
        return;
      }

      introPlayed = true;
      introActive = true; // block head rotation until intro fade begins
      clock.start();
      light.turnOnLights();
      introAnimation(() => {
        // Intro fade has started — ramp interpolation from 0 → normal over ~800ms
        // so head glides smoothly into mouse-follow instead of snapping
        interpolation.x = 0.01;
        interpolation.y = 0.01;
        introActive = false; // now allow handleHeadRotation() to run

        // Gradually ease interpolation up to normal values
        const steps = [
          { delay: 150, x: 0.03, y: 0.03 },
          { delay: 350, x: 0.06, y: 0.07 },
          { delay: 600, x: 0.08, y: 0.10 },
          { delay: 900, x: 0.08, y: 0.10 }, // final steady values
        ];
        steps.forEach(({ delay, x, y }) => {
          setTimeout(() => {
            interpolation.x = x;
            interpolation.y = y;
          }, delay);
        });
      });
    };
    const onIntroDismissed = () => {
      introDismissed = true;
      // Do NOT call clock.start() here — it's already started in startIntroWhenReady()
      // calling it twice resets elapsedTime and causes a delta spike on the next frame
      if (loadedCharacter) {
        handleResize(renderer, camera, canvasDiv, loadedCharacter);
      }
      startIntroWhenReady();
    };
    window.addEventListener("portfolio-intro-dismissed", onIntroDismissed);

    const clock = new THREE.Clock();

    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    // Load character in background immediately so shaders, textures, and animations are ready
    loadCharacter().then((gltf) => {
      if (cancelled) {
        return;
      }

      if (!gltf) {
        setLoading(100);
        setIsLoading(false);
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

      // Precompile all shaders with full scene lighting & materials
      renderer.compile(scene, camera);

      progress.loaded().then(() => {
        if (!cancelled) {
          introReady = true;
          startIntroWhenReady();
        }
      });
    });

    const mouse = { x: 0, y: 0 };
    const interpolation = { x: 0.08, y: 0.10 };

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

      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.05);
      if (mixer) {
        mixer.update(delta);
      }

      if (headBone && !introActive) {
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
  }, [setIsLoading, setLoading]);

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
