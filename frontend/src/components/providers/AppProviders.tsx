'use client'

import React from 'react';
import { ProcessingModeProvider } from '@/lib/context/ProcessingModeContext';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <TooltipProvider>
      <ProcessingModeProvider>
        {children}
      </ProcessingModeProvider>
    </TooltipProvider>
  );
} 