import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** True when a lazily loaded screen chunk failed to download (stale cache after an update). */
function isChunkLoadError(error: Error): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|error loading dynamically imported module/i.test(
    `${error.name} ${error.message}`,
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error && isChunkLoadError(this.state.error)) {
      // A screen's code chunk could not be fetched — almost always because a
      // new version was deployed and the cached file names changed. A reload
      // picks up the new version; nothing stored on the device is affected.
      return (
        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-base font-semibold text-amber-900">This screen needs a quick reload</h2>
          <p className="mt-1 text-sm text-amber-800">
            The app was updated while it was open. Reload to load the latest version. Your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 min-h-11 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Reload app
          </button>
        </div>
      );
    }
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
