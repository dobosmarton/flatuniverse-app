import { useState } from 'react';
import { readDataStream } from 'ai';
import useSWRMutation from 'swr/mutation';
import { type ArticleMetadata, articleMetadataSchema } from '@/lib/article-metadata/schema';

/**
 * Hook for handling streaming text completions from an API endpoint
 *
 * @param url - The API endpoint URL to send completion requests to
 * @returns A tuple containing:
 * - trigger: Function to start a completion request with a prompt
 * - state object containing:
 *   - completion: The current completion text
 *   - documents: The current documents
 *   - error: Any error that occurred
 *   - isLoading: Whether a request is in progress
 *
 * @example
 * ```tsx
 * const [trigger, { completion, documents, error, isLoading }] = useCompletion('/api/completion');
 *
 * // Start a completion
 * trigger({ prompt: 'Hello' });
 *
 * // Access the streaming response
 * console.log(completion); // Current completion text
 * console.log(documents); // Current documents
 * ```
 */
export const useCompletion = (url: string, initialSuggestions?: ArticleMetadata[]) => {
  const [completion, setCompletion] = useState<string>('');
  const [documents, setDocuments] = useState<ArticleMetadata[]>(initialSuggestions ?? []);

  const [abortController, setAbortController] = useState<AbortController | null>();

  const { trigger, isMutating, error } = useSWRMutation<void, unknown, string, { prompt: string }>(
    url,
    async (url, { arg: { prompt } }) => {
      setCompletion('');
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

      for await (const { type, value } of readDataStream(reader, { isAborted: () => abortController === null })) {
        if (type === 'text') {
          setCompletion((prev) => (prev ? prev + value : value));
        } else if (type === 'message_annotations') {
          if (value[0] && typeof value[0] === 'string') {
            const parsed = JSON.parse(value[0]);

            const metadata = articleMetadataSchema.parse(parsed.article_metadata);

            setDocuments((prev) => {
              if (prev.some((doc) => doc.id === metadata.id)) {
                return prev;
              }
              return [...prev, metadata];
            });
          }
        }
      }
      setAbortController(null);
    }
  );

  return [trigger, { completion, documents, error, isLoading: isMutating }] as const;
};
