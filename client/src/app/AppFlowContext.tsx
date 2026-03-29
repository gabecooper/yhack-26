import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppFlow = 'dev' | 'real';

interface AppFlowContextValue {
  flow: AppFlow | null;
  isReady: boolean;
  selectFlow: (nextFlow: AppFlow) => void;
  clearFlow: () => void;
}

const STORAGE_KEY = 'raccoon_app_flow';

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({ children }: { children: ReactNode }) {
  const [flow, setFlow] = useState<AppFlow | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedFlow = window.localStorage.getItem(STORAGE_KEY);

    if (storedFlow === 'dev' || storedFlow === 'real') {
      setFlow(storedFlow);
    }

    setIsReady(true);
  }, []);

  const value = useMemo<AppFlowContextValue>(() => ({
    flow,
    isReady,
    selectFlow(nextFlow) {
      window.localStorage.setItem(STORAGE_KEY, nextFlow);
      setFlow(nextFlow);
    },
    clearFlow() {
      window.localStorage.removeItem(STORAGE_KEY);
      setFlow(null);
    },
  }), [flow, isReady]);

  return <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>;
}

export function useAppFlow() {
  const context = useContext(AppFlowContext);

  if (!context) {
    throw new Error('useAppFlow must be used within an AppFlowProvider');
  }

  return context;
}
