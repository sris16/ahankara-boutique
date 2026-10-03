"use client";

import React from "react";
import { ErrorState } from "./error-state";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LocalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You could log to an error reporting service here
    console.error("LocalErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorState
          variant="inline"
          title={this.props.title || "Section unavailable"}
          message={this.props.message || "An error occurred while loading this section."}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
