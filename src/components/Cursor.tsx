import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If mobile or touch device, do not run custom cursor logic
    if (window.matchMedia("(pointer: coarse)").matches || !cursorRef.current) {
      return;
    }

    const cursor = cursorRef.current;
    let hover = false;
    let rafId: number;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power2.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power2.out" });

    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const loop = () => {
      if (!hover) {
        cursorPos.x += (mousePos.x - cursorPos.x) * 0.25;
        cursorPos.y += (mousePos.y - cursorPos.y) * 0.25;
        xTo(cursorPos.x);
        yTo(cursorPos.y);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const cleanupHandlers: Array<() => void> = [];

    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;
      const onMouseOver = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          xTo(rect.left);
          yTo(rect.top);
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };

      const onMouseOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
      };

      element.addEventListener("mouseover", onMouseOver);
      element.addEventListener("mouseout", onMouseOut);

      cleanupHandlers.push(() => {
        element.removeEventListener("mouseover", onMouseOver);
        element.removeEventListener("mouseout", onMouseOut);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      cleanupHandlers.forEach((cleanup) => cleanup());
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
