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
  /** Whether sidebar is collapsed (desktop) */
  isCollapsed: boolean;
  /** Toggle sidebar collapse state */
  toggle: () => void;
  /** Expand sidebar */
  expand: () => void;
  /** Collapse sidebar */
  collapse: () => void;
  /** Set collapse state directly */
  setCollapsed: (collapsed: boolean) => void;
  /** Whether mobile menu is open */
  isMobileOpen: boolean;
  /** Toggle mobile menu */
  toggleMobile: () => void;
  /** Open mobile menu */
  openMobile: () => void;
  /** Close mobile menu */
  closeMobile: () => void;
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      if (persist && typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsCollapsed(stored === 'true');
        }
      }
      setIsInitialized(true);
    };
    loadPersistedState();
  }, [persist]);

  // Persist state changes
  useEffect(() => {
    if (persist && isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, persist, isInitialized]);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    toggle,
    expand,
    collapse,
    setCollapsed,
    isMobileOpen,
    toggleMobile,
    openMobile,
    closeMobile,
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
