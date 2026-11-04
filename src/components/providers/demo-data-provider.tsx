"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { getDemoDataSeed } from "@/lib/ops-data";

const emptySubscribe = () => () => {};

// Infer the data structure directly from your existing seed function.
type DemoData = ReturnType<typeof getDemoDataSeed>;

type DemoDataContextType = {
  data: DemoData;
  setData: Dispatch<SetStateAction<DemoData>>;
  resetDemoData: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "pulsegrid-demo-data-v1";

const DemoDataContext = createContext<DemoDataContextType | undefined>(
  undefined
);

// Check that saved browser data has the expected top-level structure.
function isDemoData(value: unknown): value is DemoData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const saved = value as Record<string, unknown>;

  return [
    "institutions",
    "units",
    "emergencies",
    "donors",
    "users",
    "audit",
    "activity",
    "pending",
  ].every((key) => Array.isArray(saved[key]));
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoData>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
          const parsed: unknown = JSON.parse(savedData);

          if (isDemoData(parsed)) {
            return parsed;
          }
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return getDemoDataSeed();
  });

  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Save changes only after the initial browser data has loaded.
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error("Could not save PulseGrid demo data.");
    }
  }, [data, hydrated]);

  // Restore the original sample data.
  function resetDemoData() {
    setData(getDemoDataSeed());
  }

  return (
    <DemoDataContext.Provider value={{ data, setData, resetDemoData, hydrated }}>
      {children}
    </DemoDataContext.Provider>
  );
}

// Access shared demo data from any component inside the provider.
export function useDemoData() {
  const context = useContext(DemoDataContext);

  if (!context) {
    throw new Error("useDemoData must be used inside DemoDataProvider");
  }

  return context;
}