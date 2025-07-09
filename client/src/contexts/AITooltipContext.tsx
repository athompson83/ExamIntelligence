import React, { createContext, useContext, useState, useCallback } from 'react';

interface TooltipTrigger {
  id: string;
  page: string;
  element?: string;
  delay?: number;
}

interface AITooltipContextType {
  triggerTooltip: (trigger: TooltipTrigger) => void;
  dismissTooltip: (tooltipId: string) => void;
  isTooltipDismissed: (tooltipId: string) => boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AITooltipContext = createContext<AITooltipContextType | undefined>(undefined);

export function AITooltipProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState('/');
  const [dismissedTooltips, setDismissedTooltips] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed-tooltips');
    return saved ? JSON.parse(saved) : [];
  });

  const triggerTooltip = useCallback((trigger: TooltipTrigger) => {
    // Custom tooltip triggering logic
    const event = new CustomEvent('ai-tooltip-trigger', { detail: trigger });
    window.dispatchEvent(event);
  }, []);

  const dismissTooltip = useCallback((tooltipId: string) => {
    const newDismissed = [...dismissedTooltips, tooltipId];
    setDismissedTooltips(newDismissed);
    localStorage.setItem('dismissed-tooltips', JSON.stringify(newDismissed));
  }, [dismissedTooltips]);

  const isTooltipDismissed = useCallback((tooltipId: string) => {
    return dismissedTooltips.includes(tooltipId);
  }, [dismissedTooltips]);

  const value = {
    triggerTooltip,
    dismissTooltip,
    isTooltipDismissed,
    currentPage,
    setCurrentPage
  };

  return (
    <AITooltipContext.Provider value={value}>
      {children}
    </AITooltipContext.Provider>
  );
}

export function useAITooltip() {
  const context = useContext(AITooltipContext);
  if (context === undefined) {
    throw new Error('useAITooltip must be used within an AITooltipProvider');
  }
  return context;
}