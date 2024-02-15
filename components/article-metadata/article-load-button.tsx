'use client';

import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/api-client/fetch';
import { Loader2Icon } from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import { LoadingButton } from '../loading-button';

export const ArticleLoadButton = () => {
  const { trigger, isMutating } = useSWRMutation<null>(`/api/articles/remote`, fetcher);

  if (isMutating) {
    return <LoadingButton />;
  }

  return (
    <Button variant={'outline'} onClick={() => trigger()}>
      Load articles
    </Button>
  );
};
