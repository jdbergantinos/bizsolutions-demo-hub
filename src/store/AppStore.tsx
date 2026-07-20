import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ClientProfile,
  FavoritesState,
  PresentationState,
  RecentDemo,
  SelectedSolution,
} from "../types";
import { clearAll, clearDemoData, KEYS, load, remove, save, uid } from "../utils/storage";

const EMPTY_FAVORITES: FavoritesState = { industries: [], services: [], scenarios: [] };

export const EMPTY_PRESENTATION: PresentationState = {
  active: false,
  businessName: "",
  serviceIds: [],
  branches: "",
  employees: "",
  primaryProblem: "",
  stepIndex: 0,
};

interface AppStore {
  favorites: FavoritesState;
  toggleFavorite: (kind: keyof FavoritesState, id: string) => void;
  isFavorite: (kind: keyof FavoritesState, id: string) => boolean;
  resetFavorites: () => void;

  recents: RecentDemo[];
  addRecent: (serviceId: string, industryId: string) => void;
  clearRecents: () => void;

  profiles: ClientProfile[];
  activeProfileId: string | null;
  activeProfile: ClientProfile | null;
  saveProfile: (p: ClientProfile) => void;
  deleteProfile: (id: string) => void;
  duplicateProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  resetProfiles: () => void;

  solutions: SelectedSolution[];
  addSolution: (serviceId: string, industryId: string) => boolean;
  removeSolution: (id: string) => void;
  moveSolution: (id: string, dir: -1 | 1) => void;
  updateSolutionNote: (id: string, note: string) => void;
  resetSolutions: () => void;

  presentation: PresentationState;
  setPresentation: (p: PresentationState) => void;
  resetPresentation: () => void;

  resetDemos: (scenarioKey?: string) => void;
  resetEverything: () => void;
}

const Ctx = createContext<AppStore | null>(null);

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritesState>(() =>
    load(KEYS.favorites, EMPTY_FAVORITES),
  );
  const [recents, setRecents] = useState<RecentDemo[]>(() => load(KEYS.recents, []));
  const [profiles, setProfiles] = useState<ClientProfile[]>(() => load(KEYS.profiles, []));
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() =>
    load<string | null>(KEYS.activeProfile, null),
  );
  const [solutions, setSolutions] = useState<SelectedSolution[]>(() =>
    load(KEYS.solutions, []),
  );
  const [presentation, setPresentationState] = useState<PresentationState>(() =>
    load(KEYS.presentation, EMPTY_PRESENTATION),
  );

  useEffect(() => save(KEYS.favorites, favorites), [favorites]);
  useEffect(() => save(KEYS.recents, recents), [recents]);
  useEffect(() => save(KEYS.profiles, profiles), [profiles]);
  useEffect(() => save(KEYS.activeProfile, activeProfileId), [activeProfileId]);
  useEffect(() => save(KEYS.solutions, solutions), [solutions]);
  useEffect(() => save(KEYS.presentation, presentation), [presentation]);

  const store = useMemo<AppStore>(() => {
    const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;
    return {
      favorites,
      toggleFavorite: (kind, id) =>
        setFavorites((f) => ({
          ...f,
          [kind]: f[kind].includes(id) ? f[kind].filter((x) => x !== id) : [...f[kind], id],
        })),
      isFavorite: (kind, id) => favorites[kind].includes(id),
      resetFavorites: () => {
        setFavorites(EMPTY_FAVORITES);
        remove(KEYS.favorites);
      },

      recents,
      addRecent: (serviceId, industryId) =>
        setRecents((r) =>
          [{ serviceId, industryId, at: new Date().toISOString() }, ...r.filter((x) => x.serviceId !== serviceId)].slice(0, 12),
        ),
      clearRecents: () => {
        setRecents([]);
        remove(KEYS.recents);
      },

      profiles,
      activeProfileId,
      activeProfile,
      saveProfile: (p) =>
        setProfiles((all) => {
          const exists = all.some((x) => x.id === p.id);
          return exists ? all.map((x) => (x.id === p.id ? p : x)) : [...all, p];
        }),
      deleteProfile: (id) => {
        setProfiles((all) => all.filter((x) => x.id !== id));
        setActiveProfileId((cur) => (cur === id ? null : cur));
      },
      duplicateProfile: (id) =>
        setProfiles((all) => {
          const src = all.find((x) => x.id === id);
          if (!src) return all;
          return [
            ...all,
            { ...src, id: uid(), businessName: `${src.businessName} (Copy)`, createdAt: new Date().toISOString() },
          ];
        }),
      setActiveProfile: setActiveProfileId,
      resetProfiles: () => {
        setProfiles([]);
        setActiveProfileId(null);
        remove(KEYS.profiles);
        remove(KEYS.activeProfile);
      },

      solutions,
      addSolution: (serviceId, industryId) => {
        if (solutions.some((s) => s.serviceId === serviceId)) return false;
        setSolutions((s) => [
          ...s,
          { id: uid(), serviceId, industryId, note: "", addedAt: new Date().toISOString() },
        ]);
        return true;
      },
      removeSolution: (id) => setSolutions((s) => s.filter((x) => x.id !== id)),
      moveSolution: (id, dir) =>
        setSolutions((s) => {
          const i = s.findIndex((x) => x.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= s.length) return s;
          const copy = [...s];
          [copy[i], copy[j]] = [copy[j], copy[i]];
          return copy;
        }),
      updateSolutionNote: (id, note) =>
        setSolutions((s) => s.map((x) => (x.id === id ? { ...x, note } : x))),
      resetSolutions: () => {
        setSolutions([]);
        remove(KEYS.solutions);
      },

      presentation,
      setPresentation: setPresentationState,
      resetPresentation: () => {
        setPresentationState(EMPTY_PRESENTATION);
        remove(KEYS.presentation);
      },

      resetDemos: (scenarioKey) => clearDemoData(scenarioKey),
      resetEverything: () => {
        clearAll();
        setFavorites(EMPTY_FAVORITES);
        setRecents([]);
        setProfiles([]);
        setActiveProfileId(null);
        setSolutions([]);
        setPresentationState(EMPTY_PRESENTATION);
      },
    };
  }, [favorites, recents, profiles, activeProfileId, solutions, presentation]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
