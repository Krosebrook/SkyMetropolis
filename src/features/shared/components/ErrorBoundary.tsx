/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../errors/AppError';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In a real app, send to Sentry/Mixpanel here
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isAppError = error instanceof AppError;
      const errorMessage = isAppError ? error?.message : 'An unexpected error occurred.';

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center font-sans">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold mb-2 text-red-400">Critical Failure</h1>
            <p className="text-slate-400 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <button
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all"
                onClick={() => window.location.reload()}
              >
                Reload Simulation
              </button>
              <button
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-xl transition-all"
                onClick={() => {
                   // Hard reset attempt
                   localStorage.clear();
                   window.location.reload();
                }}
              >
                Factory Reset (Clear Data)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}