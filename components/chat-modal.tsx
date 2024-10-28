'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { useChat } from '@/lib/chat/useChat';

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
  } = useChat();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]" hasCloseButton={false}>
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
          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={!prompt.length || isLoading}
            onClick={() => onSubmit(prompt)}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
