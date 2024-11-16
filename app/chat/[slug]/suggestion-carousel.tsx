import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Label } from '@/components/ui/label';
import { CardSmall } from '@/components/article-metadata/card-small';

type Props = {
  articles: {
    article_metadata: {
      id: string;
      slug: string;
      title: string;
      abstract: string;
      published: string;
    };
  }[];
};

export const SuggestionCarousel = ({ articles }: Props) => {
  return (
    <>
      <Carousel
        opts={{
          align: 'start',
        }}
        className="flex flex-col w-full gap-4">
        <div className="flex flex-row justify-between items-center gap-4">
          <Label>Suggested Articles</Label>
          <div className="flex justify-center gap-4">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </div>
        <CarouselContent>
          {articles.map(({ article_metadata: article }) => (
            <CarouselItem key={article.id}>
              <CardSmall
                key={article.id}
                id={article.id}
                slug={article.slug}
                title={article.title}
                abstract={article.abstract}
                published={new Date(article.published).toDateString()}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </>
  );
};
