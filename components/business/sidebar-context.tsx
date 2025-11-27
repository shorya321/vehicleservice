/**
 * Business Sidebar Context
 * Manages sidebar collapse state across components
 *
 * SCOPE: Business module ONLY
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface SidebarContextValue {
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Toggle sidebar collapse state */
  toggle: () => void;
  /** Expand sidebar */
  expand: () => void;
  /** Collapse sidebar */
  collapse: () => void;
  /** Set collapse state directly */
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = 'business-sidebar-collapsed';

interface SidebarProviderProps {
  children: ReactNode;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Persist state to localStorage */
  persist?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  persist = true,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    }
    setIsInitialized(true);
  }, [persist]);

  // Persist state changes
  useEffect(() => {
    if (persist && isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, persist, isInitialized]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    toggle,
    expand,
    collapse,
    setCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
}

// Export context for advanced use cases
export { SidebarContext };
