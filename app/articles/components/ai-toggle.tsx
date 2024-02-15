'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useBoundStore } from '@/stores';

export const AIToggle = () => {
  const { aiEnabled, setAiEnabled } = useBoundStore();
  return (
    <>
      <Switch id="ai-mode" checked={aiEnabled} onCheckedChange={setAiEnabled} />
      <Label htmlFor="ai-mode">AI mode</Label>
    </>
  );
};
