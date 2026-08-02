'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewsletter } from '@/hooks/use-newsletter';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export const NewsletterSection = () => {
  const { form, isSubscribing, onSubscribe } = useNewsletter();

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-medium tracking-tighter sm:text-4xl md:text-5xl">
            Start Exploring Research Today
          </h2>
          <p className="mx-auto font-light max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Join our community of researchers and gain deeper insights into academic papers.
          </p>

          <Form {...form}>
            <div className="w-full max-w-sm space-y-2">
              <form className="flex space-x-2" onSubmit={form.handleSubmit(onSubscribe)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="max-w-lg flex-1">
                      <FormControl>
                        <Input {...field} placeholder="Enter your email" />
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
              </form>

              <p className="text-xs font-light text-gray-500 dark:text-gray-400">
                By subscribing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
};
