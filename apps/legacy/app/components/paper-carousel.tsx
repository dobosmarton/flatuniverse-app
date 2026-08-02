import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import Latex from 'react-latex-next';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as articleMetadataService from '@/lib/article-metadata/metadata.server';
import { articleMetadataSearchSchema } from '@/lib/article-metadata/schema';
import { Button } from '@/components/ui/button';

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

const getAbstract = (abstract: string, shortCharacterCount: number = 200) => {
  const sliced = abstract.slice(0, shortCharacterCount);
  return abstract.length > shortCharacterCount ? `${sliced}...` : sliced;
};

export const PaperCarousel: React.FC<Props> = async ({ searchParams }) => {
  const parsedSearchParams = articleMetadataSearchSchema.parse(searchParams);

  const { articles } = await articleMetadataService.searchArticleMetadata({
    ...parsedSearchParams,
    // Next.js pages are 1-indexed, but the API is 0-indexed
    page: parsedSearchParams.page - 1,
    pageSize: 10,
  });

  return (
    <Carousel
      opts={{
        align: 'end',
      }}
      className="flex flex-col w-full gap-4">
      <CarouselContent>
        {articles.map((article) => (
          <CarouselItem key={article.id} className="md:basis-1/2 lg:basis-1/4">
            <Card className="relative flex flex-col justify-between h-96">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg md:text-base font-normal">
                  <Latex>{article.title}</Latex>
                </CardTitle>
              </CardHeader>
              <div>
                <CardContent className="px-4 pb-2">
                  <div className="text-base md:text-sm font-light">
                    <Latex>{getAbstract(article.abstract)}</Latex>
                    <Link href={`/articles/${article.slug}`}>
                      <Button variant="link" className="flex gap-2 px-0 text-sm md:text-xs mt-2" size={'sm'}>
                        <span>Read more</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center lg:justify-end gap-4 lg:gap-2 lg:pr-32">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );
};
