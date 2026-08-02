'use client';

import React from 'react';
import { ShareIcon } from 'lucide-react';
import * as logger from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

type Props = {
  title: string;
  text?: string;
  slug: string;
  size?: 'small' | 'large';
};

export const ShareButton: React.FC<Props> = ({ title, text, slug, size }) => {
  const { toast } = useToast();

  const onShareButtonClick = async () => {
    try {
      const url = `${window.location.origin}/articles/${slug}`;

      if (typeof window === 'undefined') {
        throw new Error('window is undefined');
      }

      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({
          description: 'Link copied to clipboard',
        });
      }
    } catch (error) {
      logger.error('Error sharing:', error);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onShareButtonClick}>
          <ShareIcon
            size={cn({
              16: size === 'small',
              20: size === 'large',
            })}
          />
          <span className="sr-only">Share</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Share</TooltipContent>
    </Tooltip>
  );
};
