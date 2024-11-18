'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Turnstile from 'react-turnstile';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useChat } from '@/lib/chat/useChat';
import { useBoundStore } from '@/stores';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { LoadingButton } from './loading-button';
import { MessageBubble } from './ui/message';

const DEFAULT_PROMPTS = [
  'What are the latest research topics in the field of LLMs?',
  'How effective are current methods for making language models more context-aware and memory-efficient?',
  'How are quantum computing platforms being used to simulate quantum materials?',
  'What new computational approaches are being developed for solving partial differential equations?',
  'What methods are being developed to assess and mitigate cryptocurrency market risks?',
];

type Props = {};

export const ChatModal: React.FC<Props> = () => {
  const [prompt, setPrompt] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { isContextChatOpen: open, toggleContextChat: onClose } = useBoundStore();
  const {
    isCreatingThread: isLoading,
    onChatSubmit: onSubmit,
    createThreadErrorMessage: onSubmitError,
    resetCreateThreadError,
  } = useChat();

  useEffect(() => {
    if (onSubmitError) {
      resetCreateThreadError();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prompt]);

  const onCloseChat = () => {
    setPrompt('');
    onClose();
  };

  const onPromptSubmit = async (prompt: string) => {
    await onSubmit(prompt, turnstileToken);
    onCloseChat();
  };

  return (
    <Dialog open={open} onOpenChange={onCloseChat}>
      <DialogContent className="sm:max-w-[625px]" hasCloseButton={false}>
        <VisuallyHidden.Root>
          <DialogTitle>Chat</DialogTitle>
        </VisuallyHidden.Root>
        <div className="grid gap-4 py-4">
          <Textarea placeholder="Explore the papers..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="flex flex-col items-start gap-2">
          {DEFAULT_PROMPTS.map((prompt) => (
            <button key={prompt} className="text-left" onClick={() => setPrompt(prompt)}>
              <MessageBubble variant={'answer'}>{prompt}</MessageBubble>
            </button>
          ))}
        </div>
        <DialogFooter>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onLoad={() => setTurnstileToken(null)}
              />

              {isLoading ? (
                <LoadingButton />
              ) : (
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  disabled={!prompt.length || isLoading || !turnstileToken}
                  onClick={() => onPromptSubmit(prompt)}>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {onSubmitError && (
              <div className="flex flex-row items-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{onSubmitError}</span>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
