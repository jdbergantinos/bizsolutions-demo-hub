import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-base font-semibold text-red-800">Something went wrong</h2>
          <p className="mt-1 text-sm text-red-700">
            This screen hit an unexpected error. Your demo data is safe.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.assign("/");
            }}
            className="mt-4 min-h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
