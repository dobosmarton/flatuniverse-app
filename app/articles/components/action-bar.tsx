import React from 'react';
import { BookmarkIcon, NotebookTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AddEmbeddingsButton } from '@/components/article-metadata/add-embeddings-button';
import { ShareButton } from '@/components/article-metadata/share-button';
import { cn } from '@/lib/utils';

type Props = {
  articleId: string;
  articleUrl?: string;
  articleSlug: string;
  articleTitle: string;
  articleText?: string;
  hasEmbeddingsButton?: boolean;
  size?: 'small' | 'large';
};

export const ActionBar: React.FC<Props> = ({
  articleId,
  articleUrl,
  articleSlug,
  articleTitle,
  articleText,
  hasEmbeddingsButton,
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

        {hasEmbeddingsButton ? <AddEmbeddingsButton id={articleId} size={size} /> : null}

        <Tooltip>
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
        </Tooltip>
        {articleTitle && articleSlug ? (
          <ShareButton title={articleTitle} text={articleText} slug={articleSlug} size={size} />
        ) : null}
      </div>
    </div>
  );
};
