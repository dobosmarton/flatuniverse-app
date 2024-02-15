'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import React, { PropsWithChildren } from 'react';

export const ActionBarContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};
