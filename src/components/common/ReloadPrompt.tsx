import { useRegisterSW } from "virtual:pwa-register/react";
import { DownloadCloud, WifiOff, X } from "lucide-react";

/** PWA lifecycle UI: "ready to work offline" + "update available". */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-accent-soft p-2 text-accent">
          {needRefresh ? <DownloadCloud className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        </div>
        <div className="flex-1 text-sm">
          {needRefresh ? (
            <>
              <p className="font-semibold text-slate-900">Update available</p>
              <p className="mt-0.5 text-slate-500">A new version of the app is ready.</p>
              <button
                onClick={() => updateServiceWorker(true)}
                className="mt-2 min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:opacity-90"
              >
                Reload & update
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-900">Ready to work offline</p>
              <p className="mt-0.5 text-slate-500">
                The app is cached on this device. You can now present without internet.
              </p>
            </>
          )}
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => {
            setOfflineReady(false);
            setNeedRefresh(false);
          }}
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
