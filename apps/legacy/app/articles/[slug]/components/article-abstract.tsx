'use client';

import 'katex/dist/katex.min.css';
import React, { PropsWithChildren } from 'react';
import Latex from 'react-latex-next';

type Props = {
  children: string;
};

export const ArticleAbstract: React.FC<Props> = ({ children }) => {
  return (
    <span className="text-base text-slate-600">
      <Latex>{children}</Latex>
    </span>
  );
};
