'use client';

import { useState } from 'react';
import { readDataStream } from 'ai';
import useSWRMutation from 'swr/mutation';
import { articleMetadataSchema } from '@/lib/article-metadata/schema';
import { useBoundStore } from '@/stores';

/**
 * Hook for handling streaming text completions from an API endpoint
 *
 * @param slug - The slug of the chat thread to add suggested articles to
 * @returns A tuple containing:
 * - trigger: Function to start a completion request with a prompt
 * - state object containing:
 *   - error: Any error that occurred
 *   - isLoading: Whether a request is in progress
 *
 * @example
 * ```tsx
 * const [trigger, { error, isLoading }] = useCompletion('/api/completion');
 *
 * // Start a completion
 * trigger({ prompt: 'Hello' });
 * ```
 */
export const useCompletion = (slug: string) => {
  const { getChatBySlug, addSuggestedArticleToChat, addMessageToChat, addCompletionToChat } = useBoundStore();

  const chat = getChatBySlug(slug);

  const [abortController, setAbortController] = useState<AbortController | null>();

  const { trigger, isMutating, error } = useSWRMutation<void, unknown, string, { prompt: string }>(
    `/api/chat/${slug}/completion`,
    async (url, { arg: { prompt } }) => {
      if (!chat) {
        throw new Error('Chat not found');
      }

      addMessageToChat(slug, {
        id: slug,
        created_at: new Date(),
        updated_at: new Date(),
        role: 'ASSISTANT',
        content: '',
        chat_thread_id: chat.id,
      });

      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      const signal = controller.signal;
      setAbortController(controller);

      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        signal,
      });

      if (!res.body) {
        throw new Error('The response body is empty.');
      }

      const reader = res.body.getReader();

      try {
        for await (const { type, value } of readDataStream(reader, { isAborted: () => abortController === null })) {
          if (type === 'text') {
            addCompletionToChat(slug, slug, value);
          } else if (type === 'message_annotations') {
            if (value[0] && typeof value[0] === 'string') {
              const parsed = JSON.parse(value[0]);

              const metadata = articleMetadataSchema.parse(parsed.article_metadata);

              addSuggestedArticleToChat(slug, metadata);
            }
          }
        }
      } catch (error) {
        console.error('Error reading data stream:', error);
      }

      setAbortController(null);
    }
  );

  return [trigger, { error, isLoading: isMutating }] as const;
};
