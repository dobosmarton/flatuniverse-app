import React, { useState } from 'react';
import useSWR from 'swr';
import Latex from 'react-latex-next';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon, Maximize2, Minimize2, User2Icon } from 'lucide-react';
import { fetcher } from '@/lib/api-client/fetch';
import { CollapsibleContent } from '@radix-ui/react-collapsible';
import { ActionBar } from '@/components/article-metadata/action-bar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SummaryPanel } from './summary-panel';
import { Collapsible, CollapsibleTrigger } from '../ui/collapsible';

type Props = {
  similarToTitle?: string;
  id: string;
  slug: string;
  title: string;
  abstract: string;
  published: string;
  authors: string[];
  categories: { short_name: string; full_name: string; group_name: string }[];
  links: { title: string | null; href: string; type: string | null }[];
  setSelectedSimilarItem: (itemId: string | null) => void;
};

export const SimilarArticleCard: React.FC<Props> = ({
  similarToTitle,
  id,
  slug,
  title,
  abstract,
  published,
  authors,
  categories,
  links,
  setSelectedSimilarItem,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [isAbstractOpen, setAbstractOpen] = useState(false);

  const generatedSummary = '';
  const isSummaryLoading = false;
  /*  const { data: generatedSummary, isLoading: isSummaryLoading } = useSWR(
    `/api/articles/${id}/summary`,
    fetcher<String>,
    { revalidateOnFocus: false }
  ); */

  const onCardSizeChange = () => {
    setSelectedSimilarItem(isOpen ? null : id);
    if (isOpen) {
      setAbstractOpen(false);
    }
    setOpen((open) => !open);
  };

  const pdfLink = links.find((link) => link.title === 'pdf')?.href;
  const categoryGroups = Array.from(new Set(categories.map((category) => category.group_name)));

  return (
    <Card>
      <CardHeader className="relative gap-1 p-4">
        <div className="flex">
          <CardTitle className="text-sm mr-6">
            <Latex>{title}</Latex>
          </CardTitle>
          <Button variant={'ghost'} size={'icon'} className="absolute top-0 right-0 p-2" onClick={onCardSizeChange}>
            {isOpen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        {similarToTitle ? <CardDescription className="text-xs">@similar to {similarToTitle}</CardDescription> : null}

        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 ">
            <div>
              <CalendarDaysIcon size={16} className="text-muted-foreground" />
            </div>
            <CardDescription className="text-sm">{`${published}`}</CardDescription>
          </div>

          {isOpen ? (
            <div className="flex flex-row gap-2">
              <div>
                <User2Icon size={16} className="text-muted-foreground" />
              </div>
              <CardDescription className="text-sm"> {`${authors.join(', ')}`}</CardDescription>
            </div>
          ) : null}
        </div>

        <div className="space-x-1">
          {categoryGroups.map((group) => (
            <Badge variant={'default'} key={group}>
              {group}
            </Badge>
          ))}
        </div>
      </CardHeader>
      {isOpen ? (
        <CardContent className={'flex flex-col text-sm p-0 px-4 gap-4'}>
          <Collapsible open={isAbstractOpen} onOpenChange={setAbstractOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="link" className="flex gap-1 px-0">
                <span className="text-xs">Read abstract</span>
                {isAbstractOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Latex>{abstract}</Latex>
            </CollapsibleContent>
          </Collapsible>

          <SummaryPanel size="small" isLoading={isSummaryLoading}>
            {generatedSummary}
          </SummaryPanel>
        </CardContent>
      ) : null}

      {isOpen ? (
        <CardFooter className="p-4">
          <ActionBar
            articleId={id}
            articleSlug={slug}
            articleTitle={title}
            articleText={abstract.slice(0, 120)}
            articleUrl={pdfLink}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
};
