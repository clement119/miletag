import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { RunnerCount } from '@/domain/catalog';
import { createDesignDocument, type DesignDocument } from '@/domain/design-document';

type DesignStore = {
  runnerCount: RunnerCount;
  setRunnerCount: (n: RunnerCount) => void;
  doc: DesignDocument | null;
  startDesign: (designId: string) => void;
  update: (fn: (doc: DesignDocument) => DesignDocument) => void;
};

const DesignContext = createContext<DesignStore | null>(null);

/** In-memory store for the create flow. Persistence (Supabase) comes later. */
export function DesignProvider({ children }: { children: ReactNode }) {
  const [runnerCount, setRunnerCount] = useState<RunnerCount>(1);
  const [doc, setDoc] = useState<DesignDocument | null>(null);

  const value = useMemo<DesignStore>(
    () => ({
      runnerCount,
      setRunnerCount,
      doc,
      startDesign: (designId) => setDoc(createDesignDocument(designId, runnerCount)),
      update: (fn) => setDoc((current) => (current ? fn(current) : current)),
    }),
    [runnerCount, doc],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignStore {
  const store = useContext(DesignContext);
  if (!store) throw new Error('useDesign must be used inside <DesignProvider>');
  return store;
}
