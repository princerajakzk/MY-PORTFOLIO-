import { createContext, PropsWithChildren, useCallback, useState } from "react";
import Loading from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);
  const [canLoadContent, setCanLoadContent] = useState(false);
  const startContentLoading = useCallback(() => setCanLoadContent(true), []);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };

  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {isLoading && <Loading percent={loading} onIntroComplete={startContentLoading} />}
      <main className="main-body">{canLoadContent && children}</main>
    </LoadingContext.Provider>
  );
};

