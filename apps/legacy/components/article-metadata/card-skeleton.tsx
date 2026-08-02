import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] rounded-xl" />
    </div>
  );
};
