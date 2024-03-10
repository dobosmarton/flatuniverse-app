'use client';

import 'katex/dist/katex.min.css';
import { useState } from 'react';
import Latex from 'react-latex-next';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon, User2Icon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

import { useBoundStore } from '@/stores';
import useSWR from 'swr';
import { fetcher } from '@/lib/api-client/fetch';
import { HasEmbeddingsForArticle } from '@/lib/embeddings/embeddings.server';
import { Badge } from '../ui/badge';
import { SummaryPanel } from './summary-panel';
import { cn } from '@/lib/utils';
import { ActionBar } from '@/app/articles/components/action-bar';

type Props = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  published: string;
  authors: string[];
  categories: { short_name: string; full_name: string; group_name: string }[];
  links: { title: string | null; href: string; type: string | null }[];
};

const shortCharacters = 240;

export const ArticleMetadataCard: React.FC<Props> = ({
  id,
  slug,
  title,
  abstract,
  published,
  authors,
  categories,
  links,
}) => {
  const [isOpen, setOpen] = useState(false);
  const { aiEnabled, categories: selectedCategories, toggleCategoryGroup, toggleCategory } = useBoundStore();

  const { data: hasEmbeddings, isLoading: isEmbeddingsLoading } = useSWR(
    aiEnabled ? `/api/articles/${id}/has-embeddings` : null,
    fetcher<HasEmbeddingsForArticle>
  );

  const { data: generatedSummary, isLoading: isSummaryLoading } = useSWR(
    aiEnabled ? `/api/articles/${id}/summary` : null,
    fetcher<String>,
    { revalidateOnFocus: false }
  );

  const renderShowMoreButton = () => {
    if (!isOpen && abstract.length <= shortCharacters) return;

    return (
      <Button variant={'link'} className="flex gap-2 px-0" onClick={() => setOpen((prev) => !prev)}>
        {isOpen ? 'Read less' : 'Read full abstract'}
        {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </Button>
    );
  };

  const pdfLink = links.find((link) => link.title === 'pdf')?.href;
  const categoryGroups = Array.from(new Set(categories.map((category) => category.group_name)));

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <CardTitle>{title}</CardTitle>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 ">
            <div>
              <CalendarDaysIcon size={18} className="text-muted-foreground" />
            </div>
            <CardDescription>{`${published}`}</CardDescription>
          </div>

          <div className="flex flex-row gap-2">
            <div>
              <User2Icon size={18} className="text-muted-foreground" />
            </div>
            <CardDescription> {`${authors.join(', ')}`}</CardDescription>
          </div>
        </div>

        <div className="gap-2">
          {categoryGroups.map((group) => (
            <Badge className={cn('m-1 cursor-pointer')} key={group} onClick={() => toggleCategoryGroup(group)}>
              {group}
            </Badge>
          ))}
          {categories.map((category) => (
            <Badge
              key={category.short_name}
              className={cn('m-1 cursor-pointer', {
                'outline outline-1 outline-offset-0': selectedCategories?.includes(category.short_name),
              })}
              variant={'secondary'}
              onClick={() => toggleCategory(category.group_name, category.short_name)}>
              {category.full_name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Latex>{isOpen ? abstract : `${abstract.slice(0, shortCharacters)}...`}</Latex>
          <div>{renderShowMoreButton()}</div>
        </div>
        {aiEnabled ? <SummaryPanel isLoading={isSummaryLoading}>{generatedSummary}</SummaryPanel> : null}
      </CardContent>
      <CardFooter className="gap-4 grow items-end">
        <ActionBar
          articleId={id}
          articleSlug={slug}
          articleTitle={title}
          articleText={abstract.slice(0, shortCharacters)}
          articleUrl={pdfLink}
          hasEmbeddingsButton={aiEnabled && !isEmbeddingsLoading && !hasEmbeddings}
        />
      </CardFooter>
    </Card>
  );
};
