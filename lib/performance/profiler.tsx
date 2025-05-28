import { createContext, useContext, type ReactNode } from 'react';

export type ExtendedProfilerOnRenderCallback = (
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) => void;

interface ProfilerContextValue {
  onRender: ExtendedProfilerOnRenderCallback;
  isRunning: boolean;
}

export const ProfilerContext = createContext<ProfilerContextValue>({
  onRender: () => {},
  isRunning: false,
});

interface ProfilerProviderProps {
  children: ReactNode;
  onRender: ExtendedProfilerOnRenderCallback;
  isRunning: boolean;
}

export function ProfilerProvider({ children, onRender, isRunning }: ProfilerProviderProps) {
  return <ProfilerContext.Provider value={{ onRender, isRunning }}>{children}</ProfilerContext.Provider>;
}

export function useProfiler() {
  const context = useContext(ProfilerContext);
  if (!context) {
    throw new Error('useProfiler must be used within a ProfilerProvider');
  }
  return context;
}
