'use client';

import React from 'react';
import { BinaryIcon } from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import { post } from '@/lib/api-client/post';
import { Button } from '../ui/button';
import { LoadingButton } from '../loading-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  size?: 'small' | 'large';
};

export const AddEmbeddingsButton: React.FC<Props> = ({ id, size }) => {
  const { trigger, isMutating } = useSWRMutation(`/api/embeddings/${id}`, post);

  if (isMutating) {
    return <LoadingButton />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => trigger()}>
          <BinaryIcon
            size={cn({
              16: size === 'small',
              20: size === 'large',
            })}
          />
          <span className="sr-only">Add embedding</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent> Add embedding</TooltipContent>
    </Tooltip>
  );
};
