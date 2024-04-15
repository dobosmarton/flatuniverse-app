'use client';

import 'katex/dist/katex.min.css';
import React from 'react';
import Latex from 'react-latex-next';

type Props = {
  authors: {
    author: {
      name: string;
    };
  }[];
};

export const ArticleAuthor: React.FC<Props> = ({ authors }) => {
  return <Latex>{`${authors.map(({ author }) => author.name).join(', ')}`}</Latex>;
};
