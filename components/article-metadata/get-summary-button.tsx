'use client';

import { post } from '@/lib/api-client/post';
import React from 'react';
import useSWRMutation from 'swr/mutation';
import { Button } from '../ui/button';
import { Bot } from 'lucide-react';
import { LoadingButton } from '../loading-button';
import { fetcher } from '@/lib/api-client/fetch';

type Props = {
  id: string;
};

export const GetSummaryButton: React.FC<Props> = ({ id }) => {
  const { data, trigger, isMutating } = useSWRMutation<null>(`/api/articles/${id}/summary`, fetcher);

  if (isMutating) {
    return <LoadingButton />;
  }

  return (
    <Button variant={'outline'} onClick={() => trigger()}>
      <Bot className="mr-2 h-4 w-4" /> Summary
    </Button>
  );
};
