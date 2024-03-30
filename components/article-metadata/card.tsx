'use client';

import 'katex/dist/katex.min.css';
import { useEffect, useState } from 'react';
import Latex from 'react-latex-next';
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  User2Icon,
} from 'lucide-react';
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
  const [isAbstractOpen, setAbstractOpen] = useState(false);
  const [isCardOpen, setCardOpen] = useState(false);
  const {
    authors: selectedAuthors,
    similarArticlesEnabled,
    summaryEnabled,
    categories: selectedCategories,
    toggleCategoryGroup,
    toggleCategory,
    toggleAuthor,
    isCompactMode,
  } = useBoundStore();

  useEffect(() => {
    if (!isCompactMode) {
      setCardOpen(false);
    }
  }, [isCompactMode]);

  const { data: hasEmbeddings, isLoading: isEmbeddingsLoading } = useSWR(
    similarArticlesEnabled || summaryEnabled ? `/api/articles/${id}/has-embeddings` : null,
    fetcher<HasEmbeddingsForArticle>
  );

  const { data: generatedSummary, isLoading: isSummaryLoading } = useSWR(
    summaryEnabled ? `/api/articles/${id}/summary` : null,
    fetcher<String>,
    { revalidateOnFocus: false }
  );

  const renderShowMoreButton = () => {
    if (!isAbstractOpen && abstract.length <= shortCharacters) return;

    return (
      <Button variant={'link'} className="flex gap-2 px-0" onClick={() => setAbstractOpen((prev) => !prev)}>
        {isAbstractOpen ? 'Read less' : 'Read full abstract'}
        {isAbstractOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
      </Button>
    );
  };

  const pdfLink = links.find((link) => link.title === 'pdf')?.href;
  const categoryGroups = Array.from(new Set(categories.map((category) => category.group_name)));

  const isOpen = isCompactMode ? isCardOpen : true;

  return (
    <Card className="relative flex flex-col w-full">
      {isCompactMode ? (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 font-normal"
          onClick={() => setCardOpen((isOpen) => !isOpen)}>
          {isCardOpen ? <ChevronsDownUpIcon className="h-4 w-4" /> : <ChevronsUpDownIcon className="h-4 w-4" />}
        </Button>
      ) : null}

      <CardHeader className={cn(' gap-2', { 'gap-1 p-4': !isOpen })}>
        <CardTitle className={cn({ 'text-base': !isOpen })}>
          <Latex>{title}</Latex>
        </CardTitle>

        <div className={cn('flex flex-col gap-2', { 'flex-row items-center gap-4': !isOpen })}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 ">
              <div>
                <CalendarDaysIcon size={18} className="text-muted-foreground" />
              </div>
              <CardDescription>{`${published}`}</CardDescription>
            </div>

            {isOpen ? (
              <div className="flex flex-row gap-2 items-center">
                <div>
                  <User2Icon size={18} className="text-muted-foreground" />
                </div>
                <CardDescription>
                  {authors.map((author, index) => {
                    const isSelected = selectedAuthors?.includes(author);
                    return (
                      <>
                        <Button
                          key={author}
                          variant={'link'}
                          size={'sm'}
                          className={cn('px-1 h-6 text-muted-foreground font-normal', {
                            underline: isSelected,
                          })}
                          onClick={() => toggleAuthor(author)}>
                          <Latex>{author}</Latex>
                        </Button>
                        {index !== authors.length - 1 && ' | '}
                      </>
                    );
                  })}
                </CardDescription>
              </div>
            ) : null}
          </div>

          <div className="gap-2">
            {categoryGroups.map((group) => (
              <Badge
                className={cn('m-1 cursor-pointer', { 'my-0 mx-1': !isOpen })}
                key={group}
                onClick={() => toggleCategoryGroup(group)}>
                {group}
              </Badge>
            ))}
            {isOpen
              ? categories.map((category) => (
                  <Badge
                    key={category.short_name}
                    className={cn('m-1 cursor-pointer', {
                      'outline outline-1 outline-offset-0': selectedCategories?.includes(category.short_name),
                    })}
                    variant={'secondary'}
                    onClick={() => toggleCategory(category.group_name, category.short_name)}>
                    {category.full_name}
                  </Badge>
                ))
              : null}
          </div>
        </div>
      </CardHeader>
      {isOpen ? (
        <CardContent className="flex flex-col gap-4">
          <div>
            <Latex>{isAbstractOpen ? abstract : `${abstract.slice(0, shortCharacters)}...`}</Latex>
            <div>{renderShowMoreButton()}</div>
          </div>
          {summaryEnabled ? <SummaryPanel isLoading={isSummaryLoading}>{generatedSummary}</SummaryPanel> : null}
        </CardContent>
      ) : null}
      {isOpen ? (
        <CardFooter className="gap-4 grow items-end">
          <ActionBar
            articleId={id}
            articleSlug={slug}
            articleTitle={title}
            articleText={abstract.slice(0, shortCharacters)}
            articleUrl={pdfLink}
            hasEmbeddingsButton={(similarArticlesEnabled || summaryEnabled) && !isEmbeddingsLoading && !hasEmbeddings}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
};
