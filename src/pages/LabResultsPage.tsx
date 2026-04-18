import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Trophy, RefreshCw, FlaskConical, X, Clock, Hash, Gauge, Plus, CircleAlert as AlertCircle } from 'lucide-react';
import { usePromptLabStore } from '../stores/promptLabStore';
import type { ModelId, PromptLabCellResult, PromptVariant } from '../types';
import { toast } from 'sonner';

const MODEL_META: Record<ModelId, { name: string; accent: string }> = {
  claude: { name: 'Claude', accent: 'from-orange-500 to-amber-500' },
  grok: { name: 'Grok', accent: 'from-sky-500 to-cyan-500' },
  gemini: { name: 'Gemini', accent: 'from-emerald-500 to-teal-500' },
};

function findResult(
  results: PromptLabCellResult[],
  variantId: string,
  platform: ModelId
): PromptLabCellResult | undefined {
  return results.find((r) => r.variantId === variantId && r.platform === platform);
}

function StatusPill({ status }: { status: PromptLabCellResult['status'] }) {
  const map: Record<PromptLabCellResult['status'], { label: string; className: string }> = {
    pending: { label: 'Queued', className: 'bg-slate-800 text-slate-400' },
    streaming: { label: 'Running', className: 'bg-cyan-500/15 text-cyan-300' },
    done: { label: 'Done', className: 'bg-emerald-500/10 text-emerald-300' },
    error: { label: 'Error', className: 'bg-rose-500/10 text-rose-300' },
  };
  const cfg = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>{cfg.label}</span>;
}

export function LabResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessionId: activeSessionId,
    title,
    selectedModels,
    variants,
    results,
    running,
    cellsTotal,
    cellsDone,
    loadSession,
    rerunCell,
    toggleWinner,
  } = usePromptLabStore();

  const [expanded, setExpanded] = useState<{ variantId: string; platform: ModelId } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    if (sessionId !== activeSessionId) {
      void loadSession(sessionId);
    }
  }, [sessionId, activeSessionId, loadSession]);

  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => a.variantIndex - b.variantIndex),
    [variants]
  );

  const columnStats = useMemo(() => {
    const stats: Record<ModelId, { avgTime: number; avgWords: number; wins: number; count: number }> = {
      claude: { avgTime: 0, avgWords: 0, wins: 0, count: 0 },
      grok: { avgTime: 0, avgWords: 0, wins: 0, count: 0 },
      gemini: { avgTime: 0, avgWords: 0, wins: 0, count: 0 },
    };
    results.forEach((r) => {
      if (r.status !== 'done') return;
      stats[r.platform].avgTime += r.responseTime;
      stats[r.platform].avgWords += r.wordCount;
      stats[r.platform].count += 1;
      if (r.isWinner) stats[r.platform].wins += 1;
    });
    (Object.keys(stats) as ModelId[]).forEach((k) => {
      const n = stats[k].count;
      if (n > 0) {
        stats[k].avgTime = Math.round(stats[k].avgTime / n);
        stats[k].avgWords = Math.round(stats[k].avgWords / n);
      }
    });
    return stats;
  }, [results]);

  const progress = cellsTotal > 0 ? Math.round((cellsDone / cellsTotal) * 100) : 0;

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleRerun = async (variantId: string, platform: ModelId) => {
    try {
      await rerunCell(variantId, platform);
    } catch {
      toast.error('Rerun failed');
    }
  };

  const handleWinner = async (variantId: string, resultId: string) => {
    try {
      await toggleWinner(variantId, resultId);
    } catch {
      toast.error('Could not set winner');
    }
  };

  const expandedCell = expanded
    ? findResult(results, expanded.variantId, expanded.platform)
    : undefined;
  const expandedVariant = expanded
    ? sortedVariants.find((v) => v.id === expanded.variantId)
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#070910] text-slate-100"
    >
      <div className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#0B0F1A]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/lab')}
              className="flex items-center gap-1.5 rounded-md border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-slate-700 hover:text-cyan-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              New lab
            </button>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-cyan-400" />
              <span className="truncate text-sm font-semibold text-slate-100">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span>
                {cellsDone}/{cellsTotal} cells
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                Running
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Lab results</h1>
          <p className="mt-1 text-sm text-slate-400">
            {sortedVariants.length} variant{sortedVariants.length === 1 ? '' : 's'} across {selectedModels.length} model{selectedModels.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0B0F1A]">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[240px] border-b border-slate-800 bg-[#0B0F1A] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Variant
                </th>
                {selectedModels.map((m) => (
                  <th
                    key={m}
                    className="min-w-[320px] border-b border-slate-800 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${MODEL_META[m].accent}`} />
                      <span className="text-sm font-semibold text-slate-100">{MODEL_META[m].name}</span>
                      <span className="ml-auto text-[10px] text-slate-500">
                        avg {columnStats[m].avgTime}ms · {columnStats[m].avgWords}w
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedVariants.map((variant: PromptVariant) => (
                <tr key={variant.id}>
                  <td className="sticky left-0 z-10 w-[240px] border-b border-slate-800/70 bg-[#0B0F1A] px-4 py-4 align-top">
                    <div className="text-xs font-semibold text-cyan-300">{variant.label}</div>
                    <div className="mt-1.5 line-clamp-5 text-[11px] leading-relaxed text-slate-400">
                      {variant.prompt}
                    </div>
                  </td>
                  {selectedModels.map((platform) => {
                    const cell = findResult(results, variant.id, platform);
                    return (
                      <td
                        key={platform}
                        className="min-w-[320px] border-b border-slate-800/70 px-3 py-3 align-top"
                      >
                        <LabCell
                          cell={cell}
                          variantId={variant.id}
                          platform={platform}
                          onExpand={() => setExpanded({ variantId: variant.id, platform })}
                          onCopy={() => cell && handleCopy(cell.content)}
                          onRerun={() => handleRerun(variant.id, platform)}
                          onWinner={() => cell && handleWinner(variant.id, cell.id)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sticky left-0 z-10 bg-[#0B0F1A] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Wins per model
                </td>
                {selectedModels.map((m) => (
                  <td key={m} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      {columnStats[m].wins}
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => navigate('/lab')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0B0F1A] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300"
          >
            <Plus className="h-4 w-4" />
            Start a new lab session
          </button>
        </div>
      </div>

      {expanded && expandedCell && expandedVariant && (
        <ExpandedCellModal
          cell={expandedCell}
          variant={expandedVariant}
          onClose={() => setExpanded(null)}
          onCopy={() => handleCopy(expandedCell.content)}
        />
      )}
    </motion.div>
  );
}

function LabCell({
  cell,
  platform,
  onExpand,
  onCopy,
  onRerun,
  onWinner,
}: {
  cell: PromptLabCellResult | undefined;
  variantId: string;
  platform: ModelId;
  onExpand: () => void;
  onCopy: () => void;
  onRerun: () => void;
  onWinner: () => void;
}) {
  if (!cell) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-[#0A0E18] p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-600" />
          Waiting for {MODEL_META[platform].name}
        </div>
      </div>
    );
  }

  const isStreaming = cell.status === 'streaming' || cell.status === 'pending';
  const isError = cell.status === 'error';
  const preview = cell.content.slice(0, 240);

  return (
    <div
      className={`group relative rounded-xl border bg-[#0A0E18] p-3 transition ${
        cell.isWinner
          ? 'border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <StatusPill status={cell.status} />
        {cell.isWinner && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <Trophy className="h-3 w-3" />
            Winner
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onCopy}
            disabled={!cell.content}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={onRerun}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            title="Rerun"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button
            onClick={onWinner}
            className={`rounded-md p-1 transition ${
              cell.isWinner
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-500 hover:bg-slate-800 hover:text-amber-300'
            }`}
            title="Mark winner"
          >
            <Trophy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isError ? (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/5 p-2 text-xs text-rose-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-3">{cell.error || 'Request failed'}</span>
        </div>
      ) : isStreaming && !cell.content ? (
        <div className="space-y-2">
          <div className="h-2 w-full animate-pulse rounded bg-slate-800" />
          <div className="h-2 w-5/6 animate-pulse rounded bg-slate-800" />
          <div className="h-2 w-4/6 animate-pulse rounded bg-slate-800" />
        </div>
      ) : (
        <button
          onClick={onExpand}
          className="w-full text-left text-xs leading-relaxed text-slate-300 hover:text-slate-100"
        >
          <div className="line-clamp-6 whitespace-pre-wrap">{preview}</div>
          {cell.content.length > preview.length && (
            <span className="mt-1 inline-block text-[10px] font-semibold text-cyan-400">Expand</span>
          )}
        </button>
      )}

      {cell.status === 'done' && (
        <div className="mt-3 flex items-center gap-3 border-t border-slate-800/70 pt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {cell.responseTime}ms
          </span>
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {cell.wordCount}w
          </span>
          {cell.confidence > 0 && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {Math.round(cell.confidence * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandedCellModal({
  cell,
  variant,
  onClose,
  onCopy,
}: {
  cell: PromptLabCellResult;
  variant: PromptVariant;
  onClose: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F1A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <div>
            <div className="text-xs font-semibold text-cyan-300">{variant.label}</div>
            <div className="text-sm font-semibold text-slate-100">
              {MODEL_META[cell.platform].name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="rounded-md border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-700 hover:text-cyan-300"
            >
              <Copy className="mr-1 inline-block h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-lg border border-slate-800 bg-[#0A0E18] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Prompt
            </div>
            <div className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{variant.prompt}</div>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {cell.content || cell.error || 'No content'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
