import { useCallback, useEffect, useRef } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/useLoading";

const introUrl =
  "/Welcome%20To%20My%20Portfolio%20%E2%80%93%203D%20Intro.html?v=4";

const Loading = ({ percent, onIntroComplete }: {
  percent: number;
  onIntroComplete: () => void;
}) => {
  const { setIsLoading } = useLoading();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dismissTimer = useRef<number | undefined>(undefined);
  const dismissed = useRef(false);
  const contentReady = useRef(false);
  const dismissalRequested = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) {
      return;
    }

    dismissalRequested.current = true;
    onIntroComplete();
    if (!contentReady.current) return;

    dismissed.current = true;
    setIsLoading(false);
    window.dispatchEvent(new Event("portfolio-intro-dismissed"));
    import("./utils/initialFX")
      .then((module) => {
        module.initialFX();
      })
      .catch((error: unknown) => {
        console.error("Failed to start the intro animation:", error);
      });
  }, [onIntroComplete, setIsLoading]);

  useEffect(() => {
    const handleIntroReady = (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.origin !== window.location.origin ||
        event.data !== "portfolio-intro-ready" ||
        dismissTimer.current !== undefined
      ) {
        return;
      }

      // Mount the expensive portfolio only after the opening motion finishes.
      onIntroComplete();
      dismissTimer.current = window.setTimeout(dismiss, 1000);
    };

    const handleContentReady = () => {
      contentReady.current = true;
      if (dismissalRequested.current) dismiss();
    };

    window.addEventListener("portfolio-content-ready", handleContentReady);
    window.addEventListener("message", handleIntroReady);
    return () => {
      window.removeEventListener("portfolio-content-ready", handleContentReady);
      window.removeEventListener("message", handleIntroReady);
      if (dismissTimer.current !== undefined) {
        window.clearTimeout(dismissTimer.current);
      }
    };
  }, [dismiss, onIntroComplete]);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(dismiss, 12000);
    return () => window.clearTimeout(fallbackTimer);
  }, [dismiss]);

  function handleIntroError() {
    console.error("Failed to load the supplied portfolio intro HTML.");
    dismiss();
  }

  return (
    <div className="loading-screen">
      <iframe
        ref={iframeRef}
        className="loading-frame"
        src={introUrl}
        title="Portfolio 3D introduction"
        aria-label={`Portfolio introduction, ${Math.round(percent)}% loaded`}
        onError={handleIntroError}
      />
    </div>
  );
};

export default Loading;
