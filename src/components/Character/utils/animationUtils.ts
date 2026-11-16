import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { eyebrowBoneNames, typingBoneNames } from "../../../data/boneData";

const setAnimations = (gltf: GLTF) => {
  const character = gltf.scene;
  const mixer = new THREE.AnimationMixer(character);
  if (gltf.animations) {
    const clipNames = ["key1", "key2", "key5", "key6"];
    clipNames.forEach((name) => {
      const clip = THREE.AnimationClip.findByName(gltf.animations, name);
      if (clip) {
        const action = mixer?.clipAction(clip);
        action!.play();
        action!.timeScale = 1.2;
      } else {
        console.error(`Animation "${name}" not found`);
      }
    });
    let typingAction: THREE.AnimationAction | null = null;
    typingAction = createBoneAction(gltf, mixer, "typing", typingBoneNames);
    if (typingAction) {
      typingAction.enabled = true;
      typingAction.play();
      typingAction.timeScale = 1.2;
    }
  }
  function startIntro(onDone?: () => void) {
    const introClip = gltf.animations.find(
      (clip) => clip.name === "introAnimation"
    );
    if (!introClip) {
      console.error('Animation "introAnimation" not found in GLTF file.');
      onDone?.();
      return;
    }

    const introAction = mixer.clipAction(introClip);
    introAction.setLoop(THREE.LoopOnce, 1);
    // Keep clamped so bones DON'T snap when clip ends — the last frame holds
    // while the weight fades out, giving a clean crossfade with no jitter
    introAction.clampWhenFinished = true;
    introAction.reset().play();

    // Timing strategy: start fade 400ms BEFORE the clip ends so the weight is
    // already ~40% by the time the last frame arrives — no sudden bone release.
    // handleHeadRotation() is also enabled here (with lerp=0.01) so it blends
    // in gently while the intro is still fading, completing a smooth crossover.
    //
    //  |-- intro plays --|-- fade (1s) --|-- stopped --|-- blink --|
    //  0              2892ms          3892ms         3942ms      4042ms
    //
    const introDuration = introClip.duration * 1000; // ≈ 3292ms
    const fadeStart  = introDuration - 400;           //  2892ms — fade starts here
    const fadeTime   = 1000;                          //  1000ms fade duration
    const stopAt     = fadeStart + fadeTime + 50;     //  3942ms — fully stopped
    const blinkStart = stopAt + 100;                  //  4042ms — blink starts

    setTimeout(() => {
      // Begin weight fade while clip still plays its last ~400ms
      introAction.fadeOut(fadeTime / 1000);
      // Enable head rotation NOW — lerp starts at 0.01 (nearly invisible)
      // so it crossfades smoothly with the fading intro weight
      onDone?.();
    }, fadeStart);

    setTimeout(() => {
      // Weight is already 0 by now — stop() just removes it from the mixer
      introAction.stop();
    }, stopAt);

    // Blink only after introAction is fully stopped → zero eyelid bone conflict
    setTimeout(() => {
      const blinkClip = gltf.animations.find((clip) => clip.name === "Blink");
      if (blinkClip) {
        const blinkAction = mixer.clipAction(blinkClip);
        blinkAction.setLoop(THREE.LoopRepeat, Infinity);
        blinkAction.reset().fadeIn(0.3).play();
      }
    }, blinkStart);
  }
  function hover(gltf: GLTF, hoverDiv: HTMLDivElement) {
    const eyeBrowUpAction = createBoneAction(
      gltf,
      mixer,
      "browup",
      eyebrowBoneNames
    );
    let isHovering = false;
    if (eyeBrowUpAction) {
      eyeBrowUpAction.setLoop(THREE.LoopOnce, 1);
      eyeBrowUpAction.clampWhenFinished = true;
      eyeBrowUpAction.enabled = true;
    }
    const onHoverFace = () => {
      if (eyeBrowUpAction && !isHovering) {
        isHovering = true;
        eyeBrowUpAction.reset();
        eyeBrowUpAction.enabled = true;
        eyeBrowUpAction.setEffectiveWeight(4);
        eyeBrowUpAction.fadeIn(0.5).play();
      }
    };
    const onLeaveFace = () => {
      if (eyeBrowUpAction && isHovering) {
        isHovering = false;
        eyeBrowUpAction.fadeOut(0.6);
      }
    };
    if (!hoverDiv) return;
    hoverDiv.addEventListener("mouseenter", onHoverFace);
    hoverDiv.addEventListener("mouseleave", onLeaveFace);
    return () => {
      hoverDiv.removeEventListener("mouseenter", onHoverFace);
      hoverDiv.removeEventListener("mouseleave", onLeaveFace);
    };
  }
  return { mixer, startIntro, hover };
};

const createBoneAction = (
  gltf: GLTF,
  mixer: THREE.AnimationMixer,
  clip: string,
  boneNames: string[]
): THREE.AnimationAction | null => {
  const AnimationClip = THREE.AnimationClip.findByName(gltf.animations, clip);
  if (!AnimationClip) {
    console.error(`Animation "${clip}" not found in GLTF file.`);
    return null;
  }

  const filteredClip = filterAnimationTracks(AnimationClip, boneNames);

  return mixer.clipAction(filteredClip);
};

const filterAnimationTracks = (
  clip: THREE.AnimationClip,
  boneNames: string[]
): THREE.AnimationClip => {
  const filteredTracks = clip.tracks.filter((track) =>
    boneNames.some((boneName) => track.name.includes(boneName))
  );

  return new THREE.AnimationClip(
    clip.name + "_filtered",
    clip.duration,
    filteredTracks
  );
};

export default setAnimations;
