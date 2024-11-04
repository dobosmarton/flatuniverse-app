'use client';

import React from 'react';
import { Loader2Icon, XIcon } from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBoundStore } from '@/stores';
import { post } from '@/lib/api-client/post';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';

type Props = {
  closable?: boolean;
};

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type FormType = z.infer<typeof formSchema>;

export const NewsletterSection: React.FC<Props> = ({ closable }) => {
  const { isBannerVisible, setBannerVisible } = useBoundStore();
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const { trigger, isMutating } = useSWRMutation(
    `/api/newsletter/subscribe`,
    async (url: string, params: { arg: FormType }) => post(url, params)
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await trigger({ email: data.email });
    form.reset();
  };

  if (closable && !isBannerVisible) {
    return null;
  }

  return (
    <Card className="relative flex flex-col py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
            <CardTitle>Stay up-to-date on science!</CardTitle>

            <CardDescription>
              {"We'll send you an email every week with the latest research papers in your field."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="flex max-w-md gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Email" {...field} className="w-64" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isMutating ? (
                <Button disabled className="min-w-[100px]">
                  <Loader2Icon width={18} height={18} className="animate-spin" />
                </Button>
              ) : (
                <Button type="submit">Subscribe</Button>
              )}
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
};
