'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2Icon, XIcon } from 'lucide-react';
import { useBoundStore } from '@/stores';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { useNewsletter } from '@/hooks/use-newsletter';

type Props = {
  closable?: boolean;
};

const NewsletterSectionComp: React.FC<Props> = ({ closable }) => {
  const { isBannerVisible, setBannerVisible } = useBoundStore();

  const { form, isSubscribing, onSubscribe } = useNewsletter();

  if (closable && !isBannerVisible) {
    return null;
  }

  return (
    <Card className="relative flex flex-col  py-4 md:py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubscribe)}>
          {closable ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 p-2 m-0"
              onClick={() => setBannerVisible(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          ) : null}
          <CardHeader className="gap-2 items-center">
            <CardTitle>Start Exploring Research Today</CardTitle>

            <CardDescription>
              {'Join our community of researchers and gain deeper insights into academic papers.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center flex-col gap-4">
            <div className="flex w-full gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="max-w-lg flex-1">
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isSubscribing ? (
                <Button disabled className="min-w-[100px]">
                  <Loader2Icon width={18} height={18} className="animate-spin" />
                </Button>
              ) : (
                <Button type="submit">Subscribe</Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {'By subscribing, you agree to our Terms of Service and Privacy Policy.'}
            </span>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
};

export const NewsletterSection = dynamic(() => Promise.resolve(NewsletterSectionComp), { ssr: false });
