'use client';

import { useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useChat } from '@/lib/chat/useChat';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { LoadingButton } from './loading-button';

const DEFAULT_PROMPTS = [
  'What is the latest research on AI?',
  'List the last 5 papers about the physics of the black holes',
  'Summarize the famous "Attention is all you need" paper',
];

type Props = {};

export const ChatModal: React.FC<Props> = () => {
  const [prompt, setPrompt] = useState('');
  const {
    isContextChatOpen: open,
    toggleContextChat: onClose,
    isCreatingThread: isLoading,
    onChatSubmit: onSubmit,
  } = useChat({});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]" hasCloseButton={false}>
        <VisuallyHidden.Root>
          <DialogTitle>Chat</DialogTitle>
        </VisuallyHidden.Root>
        <div className="grid gap-4 py-4">
          <Textarea placeholder="Explore the papers..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="flex flex-col items-start gap-2">
          {DEFAULT_PROMPTS.map((prompt) => (
            <Badge
              key={prompt}
              className={'m-1 cursor-pointer'}
              variant={'secondary'}
              onClick={() => setPrompt(prompt)}>
              {prompt}
            </Badge>
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
              onClick={() => onSubmit(prompt)}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
