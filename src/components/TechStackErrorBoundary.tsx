import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class TechStackErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("TechStack WebGL/Physics caught gracefully:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default TechStackErrorBoundary;
