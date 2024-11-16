import React from 'react';
import Link from 'next/link';
import Latex from 'react-latex-next';
import { CalendarDaysIcon, SquareArrowOutUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { CollapsibleRichText } from './collapsible-text';
import { Button } from '../ui/button';

type Props = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  published: string;
};

export const CardSmall: React.FC<Props> = ({ id, slug, title, abstract, published }) => {
  return (
    <Card className="relative flex flex-col justify-between w-full md:w-64 min-h-64">
      <Button variant="link" size="sm" className="absolute top-0 right-0 font-normal">
        <Link href={`/articles/${slug}`} target="_blank" rel="noopener noreferrer">
          <SquareArrowOutUpRight className="h-4 w-4" />
        </Link>
      </Button>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm mr-4 font-medium">
          <Latex>{title}</Latex>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2 ">
        <div className="text-sm">
          <CollapsibleRichText text={abstract} shortCharacterCount={120} size="sm" />
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-0">
        <div className="flex flex-row gap-2 items-center">
          <div>
            <CalendarDaysIcon size={12} className="text-muted-foreground" />
          </div>
          <CardDescription className="text-xs">{`${published}`}</CardDescription>
        </div>
      </CardFooter>
    </Card>
  );
};
