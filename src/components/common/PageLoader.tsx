/**
 * Shown for the brief moment while a screen's code chunk is being fetched
 * (first visit only; every chunk is precached by the service worker after
 * install, so offline navigation never waits on the network).
 */
export function PageLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
