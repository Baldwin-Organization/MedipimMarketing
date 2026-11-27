import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ItemDraft } from './data/store';

interface Editing {
  id?: string;
  defaults?: Partial<ItemDraft>;
}

interface Ui {
  editing: Editing | null;
  openItem(id?: string, defaults?: Partial<ItemDraft>): void;
  closeItem(): void;
  toast: string | null;
  notify(message: string): void;
}

const UiContext = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);
  const value = useMemo<Ui>(() => ({
    editing,
    openItem: (id, defaults) => setEditing({ id, defaults }),
    closeItem: () => setEditing(null),
    toast,
    notify,
  }), [editing, toast, notify]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): Ui {
  const u = useContext(UiContext);
  if (!u) throw new Error('useUi outside UiProvider');
  return u;
}
