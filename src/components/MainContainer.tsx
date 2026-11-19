import { lazy, PropsWithChildren, Suspense, useEffect, useState } from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import TechStackErrorBoundary from "./TechStackErrorBoundary";
import setSplitText from "./utils/splitText";
import { useLoading } from "../context/useLoading";

const TechStack = lazy(() => import("./TechStack"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const { isLoading } = useLoading();
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );
  const [loadTechStack, setLoadTechStack] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && isDesktopView) {
      const timer = window.setTimeout(() => {
        setLoadTechStack(true);
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [isLoading, isDesktopView]);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Career />
            <Work />
            {isDesktopView && loadTechStack && (
              <TechStackErrorBoundary>
                <Suspense fallback={null}>
                  <TechStack />
                </Suspense>
              </TechStackErrorBoundary>
            )}
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
