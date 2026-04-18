import { memo } from 'react';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIStore } from '../stores/aiStore';

interface LivePillProps {
  isLoading: boolean;
}

function LivePillComponent({ isLoading }: LivePillProps) {
  const liveMode = useAIStore(s => s.liveMode);
  const setLiveMode = useAIStore(s => s.setLiveMode);
  return (
    <button
      type="button"
      onClick={() => setLiveMode(!liveMode)}
      disabled={isLoading}
      title="Stream responses token-by-token"
      aria-pressed={liveMode}
      className={cn(
        'inline-flex items-center gap-1 h-5 px-1.5 rounded-full border text-[10px] font-medium transition-colors',
        liveMode
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-white/5 text-gray-500 border-white/10 hover:text-gray-300'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          liveMode ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
        )}
      />
      <Radio className="w-2.5 h-2.5" aria-hidden="true" />
      Live
    </button>
  );
}

export const LivePill = memo(LivePillComponent);
