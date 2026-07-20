// All persistent state lives under these localStorage keys. Documented in
// README.md — keep the two lists in sync.
export const KEYS = {
  favorites: "bizsolutions.favorites",
  recents: "bizsolutions.recents",
  profiles: "bizsolutions.profiles",
  activeProfile: "bizsolutions.activeProfile",
  solutions: "bizsolutions.solutions",
  presentation: "bizsolutions.presentation",
  demoPrefix: "bizsolutions.demo.",
  // Pricing keys live in src/pricing/store/pricingStorage.ts (PRICING_KEYS)
  // and share the "bizsolutions." prefix so clearAll() covers them.
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — demo state simply won't persist.
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearDemoData(scenarioKey?: string): void {
  const keys = Object.keys(localStorage).filter((k) =>
    scenarioKey ? k === KEYS.demoPrefix + scenarioKey : k.startsWith(KEYS.demoPrefix),
  );
  keys.forEach(remove);
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("bizsolutions."))
    .forEach(remove);
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
