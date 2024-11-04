import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import Latex from 'react-latex-next';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

type Props = {
  text: string;
  shortCharacterCount: number;
  size?: 'default' | 'sm';
};

export const CollapsibleRichText: React.FC<Props> = ({ text, shortCharacterCount, size = 'default' }) => {
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);

  const renderShowMoreButton = () => {
    if (!isAbstractOpen && text.length <= shortCharacterCount) return;

    return (
      <Button
        variant={'link'}
        className={cn('flex gap-2 px-0', {
          'text-xs': size === 'sm',
        })}
        size={size}
        onClick={() => setIsAbstractOpen((prev) => !prev)}>
        {isAbstractOpen ? 'Read less' : 'Read more'}
        {isAbstractOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </Button>
    );
  };

  return (
    <div>
      <Latex>{isAbstractOpen ? text : `${text.slice(0, shortCharacterCount)}...`}</Latex>
      <div>{renderShowMoreButton()}</div>
    </div>
  );
};
