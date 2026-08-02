'use client';

import * as React from 'react';
import { cva, VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';

const messageVariants = cva(
  'flex-col text-sm leading-none p-4 rounded-lg leading-relaxed max-w-3xl peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        question: 'bg-primary text-primary-foreground',
        answer: 'bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'question',
    },
  }
);

const MessageBubble: React.FC<
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageVariants> & { children: string | React.ReactNode }
> = ({ className, children, variant, ...props }) =>
  typeof children === 'string' ? (
    <Markdown className={cn(messageVariants({ variant }), className)} {...props}>
      {children}
    </Markdown>
  ) : (
    <div className={cn(messageVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );

export { MessageBubble };
