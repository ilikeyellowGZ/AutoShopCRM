import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { DemoState, Tone } from "../domain/models";
import type { DemoRepository } from "../repository/demoRepository";
import type { NavigationTarget } from "./routes";

export type OverlayTarget = { kind: "dialog" | "drawer" | "media"; id?: string } | null;
export type AppToast = { id: string; title: string; detail?: string; tone?: Tone };

export function useDemoApp(repository: DemoRepository) {
  const snapshot = useRef<DemoState>(repository.getState());
  const currentRepository = useRef(repository);
  if (currentRepository.current !== repository) { currentRepository.current = repository; snapshot.current = repository.getState(); }
  const subscribe = useCallback((notify: () => void) => repository.subscribe((next) => { snapshot.current = next; notify(); }), [repository]);
  const getSnapshot = useCallback(() => snapshot.current, []);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [target, setTarget] = useState<NavigationTarget>(() => ({ page: state.preferences.activePage as NavigationTarget["page"], subview: state.preferences.activeSubview }));
  useEffect(() => { setTarget({ page: state.preferences.activePage as NavigationTarget["page"], subview: state.preferences.activeSubview }); }, [repository]);
  const [activeOverlay, setActiveOverlay] = useState<OverlayTarget>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useCallback((next: NavigationTarget) => { setTarget(next); repository.setPreferences({ activePage: next.page, activeSubview: next.subview }); }, [repository]);
  const pushToast = useCallback((toast: Omit<AppToast, "id">) => { const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`; setToasts((items) => [...items, { ...toast, id }]); return id; }, []);
  const dismissToast = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  return { state, target, navigate, activeOverlay, setActiveOverlay, closeOverlay: () => setActiveOverlay(null), toasts, pushToast, dismissToast, searchOpen, setSearchOpen };
}
