import React from 'react';
import Latex from 'react-latex-next';
import { CalendarDaysIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

type Props = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  published: string;
};

export const CardSmall: React.FC<Props> = ({ id, slug, title, abstract, published }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs">
          <Latex>{title}</Latex>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <div className="text-xs">
          <Latex>{abstract.slice(0, 120)}...</Latex>
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
