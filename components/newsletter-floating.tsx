'use client';

import React from 'react';
import { Card, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { createPortal } from 'react-dom';

export const NewsletterFloating: React.FC = () => {
  return createPortal(
    <Card className="fixed bottom-2 right-2 bg-black">
      <div className="flex p-4 gap-4 items-center justify-center ">
        <CardDescription className="text-white">Stay up-to-date on science!</CardDescription>
        <Button variant={'secondary'} size={'sm'}>
          Subscribe
        </Button>
      </div>
    </Card>,
    document.body
  );
};
