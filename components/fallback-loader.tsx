import { Loader2Icon } from 'lucide-react';
import React from 'react';

export const FallbackLoader: React.FC = () => {
  return (
    <div className="flex justify-center">
      <Loader2Icon width={24} height={24} className={'animate-spin '} />
    </div>
  );
};
