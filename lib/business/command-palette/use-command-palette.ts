'use client';

/**
 * Command Palette Hook
 * Keyboard shortcut management for CMD+K / Ctrl+K
 *
 * SCOPE: Business module ONLY
 */

import { useEffect, useCallback, useState } from 'react';

interface UseCommandPaletteOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        options.onOpen?.();
      } else {
        options.onClose?.();
      }
      return next;
    });
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}
