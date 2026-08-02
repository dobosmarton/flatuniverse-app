'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { useBoundStore } from '@/stores';

export const AskAIButton: React.FC = () => {
  const { toggleContextChat } = useBoundStore();

  return (
    <Button className="rounded-full" size={'lg'} onClick={toggleContextChat}>
      Ask AI
    </Button>
  );
};
