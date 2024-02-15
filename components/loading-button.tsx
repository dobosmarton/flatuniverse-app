import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from './ui/button';

export const LoadingButton: React.FC = () => {
  return (
    <Button variant={'outline'} disabled className="min-w-[65px]">
      <Loader2Icon width={18} height={18} className="animate-spin" />
    </Button>
  );
};
