import { useState } from 'react';
import { GitBranchPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAIStore } from '../stores/aiStore';

interface ForkButtonProps {
  turnId: string;
  originalPrompt: string;
}

export function ForkButton({ turnId, originalPrompt }: ForkButtonProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(originalPrompt);
  const [submitting, setSubmitting] = useState(false);
  const forkTurn = useAIStore((s) => s.forkTurn);

  const onSubmit = async () => {
    const text = value.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await forkTurn(turnId, text);
      setOpen(false);
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setValue(originalPrompt);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 h-5 px-1.5 rounded-[5px] text-[10px] font-medium text-gray-500 hover:text-cyan-200 hover:bg-white/5 transition-colors"
        title="Fork this turn into a new branch"
        aria-label="Fork this turn"
      >
        <GitBranchPlus className="w-2.5 h-2.5" />
        <span>Fork</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-gray-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Fork this turn</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Create a new branch with a different prompt. The original branch stays intact and you can switch between them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-gray-500">
              New prompt
            </label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="Rephrase or ask something different..."
              className="bg-white/[0.03] border-white/10 text-gray-100 placeholder:text-gray-600 resize-none"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!value.trim() || submitting}
              className="bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-gray-950 font-medium"
            >
              {submitting ? 'Forking...' : 'Create branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
