'use client';

import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { XIcon } from 'lucide-react';
import { useBoundStore } from '@/stores';

type Props = {
  closable?: boolean;
};

export const NewsletterSection: React.FC<Props> = ({ closable }) => {
  const { isBannerVisible, setBannerVisible } = useBoundStore();
  const onNewsletterClose = () => setBannerVisible(false);

  if (closable && !isBannerVisible) {
    return null;
  }

  return (
    <Card className="relative flex flex-col py-8">
      {closable ? (
        <Button variant="ghost" size="icon" className="absolute top-0 right-0 p-2 m-0" onClick={onNewsletterClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      ) : null}
      <CardHeader className="gap-2 items-center">
        <CardTitle>Stay up-to-date on science!</CardTitle>
        <div>
          <CardDescription>
            {"We'll send you an email every week with the latest research papers in your field."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="email" placeholder="Email" />
          <Button type="submit">Subscribe</Button>
        </div>
      </CardContent>
    </Card>
  );
};
