import type { ScrollSmoother } from "gsap/ScrollSmoother";

export let smoother: ScrollSmoother | undefined;

export const setSmoother = (nextSmoother: ScrollSmoother | undefined) => {
  smoother = nextSmoother;
};
