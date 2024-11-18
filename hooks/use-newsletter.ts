import useSWRMutation from 'swr/mutation';
import { z } from 'zod';
import { post } from '@/lib/api-client/post';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export type FormType = z.infer<typeof formSchema>;

type UseNewsletterReturnType = {
  form: UseFormReturn<FormType>;
  isSubscribing: boolean;
  onSubscribe: (data: FormType) => Promise<void>;
};

export const useNewsletter = (): UseNewsletterReturnType => {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const { trigger, isMutating } = useSWRMutation(
    `/api/newsletter/subscribe`,
    async (url: string, params: { arg: { data: FormType } }) => post(url, params)
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await trigger({ data: { email: data.email } });
    form.reset();
  };

  return { form, isSubscribing: isMutating, onSubscribe: onSubmit };
};
