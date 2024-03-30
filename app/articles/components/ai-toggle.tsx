'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useBoundStore } from '@/stores';

export const AIToggle = () => {
  const { similarArticlesEnabled, summaryEnabled, setSimilarArticlesEnabled, setSummaryEnabled } = useBoundStore();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Switch id="similar-articles" checked={similarArticlesEnabled} onCheckedChange={setSimilarArticlesEnabled} />
        <Label htmlFor="similar-articles">Similar articles</Label>
      </div>
      <div className="flex gap-2 items-center">
        <Switch id="article-summary" checked={summaryEnabled} onCheckedChange={setSummaryEnabled} />
        <Label htmlFor="article-summary">Article summary</Label>
      </div>
    </div>
  );
};
