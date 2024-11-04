import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormType, useNewsletter } from '@/hooks/use-newsletter';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const ChatDemo = () => {
  const { form, isSubscribing, onSubscribe } = useNewsletter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = async (data: FormType) => {
    await onSubscribe(data);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <Textarea
          placeholder="Continue with something fascinating..."
          onClick={() => setIsModalOpen((isOpen) => !isOpen)}
          onChange={() => setIsModalOpen((isOpen) => !isOpen)}
        />
      </div>
      <Dialog open={isModalOpen} onOpenChange={() => setIsModalOpen((isOpen) => !isOpen)}>
        <DialogContent className="sm:max-w-[625px]" hasCloseButton={false}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <DialogTitle>Full chat is coming soon!</DialogTitle>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <DialogDescription>
                    We&apos;re excited to announce that the full chat feature is in development and will be available
                    soon. Stay tuned for more updates!
                  </DialogDescription>
                  <DialogDescription>
                    In the meantime, subscribe to our newsletter to get notified when it&apos;s ready!
                  </DialogDescription>
                </div>

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Email" {...field} autoFocus className="w-80" />
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
              </div>

              <DialogFooter></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
