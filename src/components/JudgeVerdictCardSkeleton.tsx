import { Scale } from 'lucide-react';

export function JudgeVerdictCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-cyan-300/60" />
        <div className="h-3 w-32 bg-white/10 rounded" />
        <div className="h-4 w-14 bg-white/10 rounded-full ml-1" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-3 w-8 bg-white/10 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-1.5 bg-white/10 rounded" />
              <div className="h-1.5 bg-white/10 rounded" />
              <div className="h-1.5 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[11px] text-gray-600">Claude is evaluating the responses...</div>
    </div>
  );
}
