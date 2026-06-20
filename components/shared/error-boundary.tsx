"use client";

import React, { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    Sentry.captureException(error, { extra: errorInfo as unknown as Record<string, unknown> });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-red-50 dark:bg-red-950/20">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">We've logged the error and will look into it.</p>
          <Button onClick={() => this.setState({ hasError: false })} variant="destructive">
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
