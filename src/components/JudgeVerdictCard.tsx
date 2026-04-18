import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Gavel, Trophy, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { JudgeVerdict, JudgeModelScore, ModelId } from '../types';
import { useAIStore } from '../stores/aiStore';

interface JudgeVerdictCardProps {
  verdict: JudgeVerdict;
  turnId: string;
  loading?: boolean;
  evaluatedModels: ModelId[];
}

const modelLabelColor: Record<ModelId, { text: string; dot: string; ring: string }> = {
  claude: { text: 'text-amber-200', dot: 'bg-amber-400', ring: 'ring-amber-400/40' },
  grok: { text: 'text-slate-200', dot: 'bg-slate-400', ring: 'ring-slate-400/40' },
  gemini: { text: 'text-blue-200', dot: 'bg-blue-400', ring: 'ring-blue-400/40' },
};

function ScoreBar({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
        <span>{label}</span>
        <span className="text-gray-300 font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${tint}`}
        />
      </div>
    </div>
  );
}

function ModelScoreRow({
  score,
  isWinner,
}: {
  score: JudgeModelScore;
  isWinner: boolean;
}) {
  const colors = modelLabelColor[score.model];
  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isWinner
          ? `border-cyan-400/40 bg-cyan-400/[0.04] ring-1 ${colors.ring}`
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-semibold capitalize ${colors.text}`}>
            {score.model}
          </span>
          {isWinner && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-cyan-400/15 text-cyan-200 border border-cyan-400/40">
              <Trophy className="w-2.5 h-2.5" /> Winner
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-2">
        <ScoreBar label="Accuracy" value={score.accuracy} tint="bg-emerald-400/80" />
        <ScoreBar label="Complete" value={score.completeness} tint="bg-cyan-400/80" />
        <ScoreBar label="Tone" value={score.tone} tint="bg-teal-400/80" />
      </div>
      {score.rationale && (
        <p className="text-[11px] text-gray-400 leading-relaxed">{score.rationale}</p>
      )}
    </div>
  );
}

export function JudgeVerdictCard({
  verdict,
  turnId,
  loading,
  evaluatedModels,
}: JudgeVerdictCardProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rerunJudge = useAIStore((s) => s.rerunJudge);

  const scoreByModel = useMemo(() => {
    const map = new Map<ModelId, JudgeModelScore>();
    for (const s of verdict.scores) map.set(s.model, s);
    return map;
  }, [verdict.scores]);

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push('AI Judge Verdict (judged by Claude)');
    if (verdict.overallWinner) lines.push(`Winner: ${verdict.overallWinner}`);
    if (verdict.overallSummary) lines.push('', verdict.overallSummary);
    lines.push('', 'Scores:');
    for (const s of verdict.scores) {
      lines.push(
        `- ${s.model}: accuracy ${s.accuracy}, completeness ${s.completeness}, tone ${s.tone} — ${s.rationale}`
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      toast.success('Verdict copied to clipboard');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Unable to copy verdict');
    }
  };

  const handleRerun = async () => {
    try {
      await rerunJudge(turnId);
      toast.success('Judge re-evaluated the responses');
    } catch {
      toast.error('Could not re-run judge');
    }
  };

  return (
    <motion.div
      data-judge-verdict
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-100">AI Judge Verdict</h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-200 border border-amber-500/30">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                Claude
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 italic">
              One AI's opinion, not a final truth
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            aria-label="Copy verdict"
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.02] text-gray-400 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleRerun}
            disabled={loading}
            aria-label="Re-judge responses"
            className="h-7 px-2 rounded-lg border border-white/10 bg-white/[0.02] text-gray-400 hover:text-cyan-200 hover:border-cyan-400/40 transition-colors flex items-center gap-1 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 disabled:opacity-50"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Re-judge</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {evaluatedModels.map((m) => {
          const s = scoreByModel.get(m);
          if (!s) {
            return (
              <div
                key={m}
                className="p-3 rounded-xl border border-white/5 bg-white/[0.01] opacity-60"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${modelLabelColor[m].dot}`} />
                  <span className="text-xs font-semibold capitalize text-gray-400">{m}</span>
                  <span className="text-[10px] text-gray-500 ml-1">Not evaluated</span>
                </div>
              </div>
            );
          }
          return (
            <ModelScoreRow
              key={m}
              score={s}
              isWinner={verdict.overallWinner === m}
            />
          );
        })}
      </div>

      {verdict.overallSummary && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setReasoningOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={reasoningOpen}
          >
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              Judge's reasoning
            </span>
            {reasoningOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {reasoningOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  {verdict.overallSummary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
