import React from 'react';
import { IndentIncreaseIcon, NotebookTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ShareButton } from './share-button';

type Props = {
  articleUrl?: string;
  articleSlug: string;
  articleTitle: string;
  articleText?: string;
  toggleSimilarArticles?: () => void;
  size?: 'small' | 'large';
};

export const ActionBar: React.FC<Props> = ({
  articleUrl,
  articleSlug,
  articleTitle,
  articleText,
  toggleSimilarArticles,
  size = 'small',
}) => {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex items-center gap-2">
        {articleUrl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <a href={articleUrl} target="_blank" rel="noopener noreferrer">
                  <NotebookTextIcon
                    size={cn({
                      16: size === 'small',
                      20: size === 'large',
                    })}
                  />
                  <span className="sr-only">Open</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open the paper</TooltipContent>
          </Tooltip>
        ) : null}

        {toggleSimilarArticles ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleSimilarArticles}>
                <IndentIncreaseIcon
                  size={cn({
                    16: size === 'small',
                    20: size === 'large',
                  })}
                />
                <span className="sr-only">Show similar articles</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show similar articles</TooltipContent>
          </Tooltip>
        ) : null}

        {/*  <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <BookmarkIcon
                size={cn({
                  16: size === 'small',
                  20: size === 'large',
                })}
              />
              <span className="sr-only">Bookmark</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bookmark</TooltipContent>
        </Tooltip> */}
        {articleTitle && articleSlug ? (
          <ShareButton title={articleTitle} text={articleText} slug={articleSlug} size={size} />
        ) : null}
      </div>
    </div>
  );
};
