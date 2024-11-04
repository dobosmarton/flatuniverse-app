'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
  const { isContextChatOpen: open, toggleContextChat: onClose } = useBoundStore();
  const { isCreatingThread: isLoading, onChatSubmit: onSubmit } = useChat();

  const onCloseChat = () => {
    setPrompt('');
    onClose();
  };

  const onPromptSubmit = async (prompt: string) => {
    await onSubmit(prompt);
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
          {isLoading ? (
            <LoadingButton />
          ) : (
            <Button
              type="submit"
              variant="outline"
              size="icon"
              disabled={!prompt.length || isLoading}
              onClick={() => onPromptSubmit(prompt)}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
