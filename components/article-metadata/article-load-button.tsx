'use client';

import { Button } from '@/components/ui/button';
import useSWRMutation from 'swr/mutation';
import { LoadingButton } from '../loading-button';
import { post } from '@/lib/api-client/post';

export const ArticleLoadButton = () => {
  const { trigger, isMutating } = useSWRMutation<null>(`/api/cron`, post);

  if (isMutating) {
    return <LoadingButton />;
  }

  return (
    <Button variant={'outline'} onClick={() => trigger()}>
      Load articles
    </Button>
  );
};
