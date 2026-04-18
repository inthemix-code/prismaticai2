import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, Check, Share2, Download, FileDown, Pin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { FusionResult, JudgeVerdict, StructuredSynthesis, ModelId } from '../types';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Markdown } from '../utils/markdown';
import { conversationPersistence } from '../services/conversationPersistence';
import { reactionsService } from '../services/reactionsService';

interface FusionPanelProps {
  fusion: FusionResult;
  conversationId?: string;
  turnId?: string;
  structured?: StructuredSynthesis | null;
  memoryUsed?: string[];
  onPinFact?: (fact: string) => void;
  canPin?: boolean;
  judgeVerdict?: JudgeVerdict | null;
}

const modelBadgeColor: Record<ModelId, string> = {
  claude: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
  grok: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
  gemini: 'bg-blue-500/15 text-blue-200 border-blue-500/40',
};

const isInsightContested = (insight: string, structured?: StructuredSynthesis | null): boolean => {
  if (!structured) return false;
  const lower = insight.toLowerCase();
  const topicHit = structured.disagreements?.some((d) => {
    const topic = d.topic?.toLowerCase() ?? '';
    if (!topic) return false;
    const words = topic.split(/\s+/).filter((w) => w.length > 3);
    return words.some((w) => lower.includes(w));
  });
  if (topicHit) return true;
  const sentenceHit = structured.sentences?.some((s) => {
    if (!s.contested_by || s.contested_by.length === 0) return false;
    const text = s.text?.toLowerCase() ?? '';
    if (!text) return false;
    const words = lower.split(/\s+/).filter((w) => w.length > 4);
    const overlap = words.filter((w) => text.includes(w)).length;
    return overlap >= 2;
  });
  return !!sentenceHit;
};

const getConfidenceRationale = (score: number) => {
  if (score >= 90) {
    return [
      'High consensus across all AI models',
      'Consistent factual information',
      'Comprehensive topic coverage',
      'Strong source reliability',
    ];
  }
  if (score >= 80) {
    return [
      'Good agreement between models',
      'Most information is consistent',
      'Minor gaps in coverage',
      'Reliable but some uncertainty',
    ];
  }
  if (score >= 70) {
    return [
      'Moderate consensus achieved',
      'Some conflicting viewpoints',
      'Reasonable topic coverage',
      'Generally trustworthy sources',
    ];
  }
  if (score >= 60) {
    return [
      'Limited agreement between models',
      'Notable information conflicts',
      'Partial topic coverage',
      'Mixed source reliability',
    ];
  }
  return [
    'Low consensus across models',
    'Significant contradictions found',
    'Incomplete information',
    'Uncertain source quality',
  ];
};

export function FusionPanel({ fusion, conversationId, turnId, structured, memoryUsed, onPinFact, canPin, judgeVerdict }: FusionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!turnId) return;
    let cancelled = false;
    reactionsService.getMyReaction(turnId).then((r) => {
      if (!cancelled) setReaction(r);
    });
    return () => {
      cancelled = true;
    };
  }, [turnId]);

  const handleReaction = async (kind: 'up' | 'down') => {
    if (!turnId || !conversationId) return;
    const next = reaction === kind ? null : kind;
    setReaction(next);
    const ok = await reactionsService.setReaction(conversationId, turnId, next);
    if (!ok) {
      setReaction(reaction);
      toast.error('Could not save feedback');
      return;
    }
    if (next === 'up') toast.success('Thanks for the feedback');
    if (next === 'down') toast.success('Feedback recorded');
  };

  useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [exportOpen]);

  const buildMarkdown = () => {
    const judgeSection = judgeVerdict
      ? `## Judge verdict (Claude)\n\n` +
        (judgeVerdict.overallWinner ? `> Winner: ${judgeVerdict.overallWinner}\n\n` : '') +
        (judgeVerdict.overallSummary ? `${judgeVerdict.overallSummary}\n\n` : '') +
        judgeVerdict.scores
          .map(
            (s) =>
              `- **${s.model}** — accuracy ${s.accuracy}, completeness ${s.completeness}, tone ${s.tone}${
                s.rationale ? ` — ${s.rationale}` : ''
              }`
          )
          .join('\n') +
        '\n\n'
      : '';

    return (
      `# Prismatic synthesis\n\n` +
      `> Confidence: ${Math.round(fusion.confidence * 100)}%\n\n` +
      (fusion.keyInsights.length
        ? `## Key insights\n\n${fusion.keyInsights.map((k) => `- ${k}`).join('\n')}\n\n`
        : '') +
      `## Response\n\n${fusion.content}\n\n` +
      judgeSection
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fusion.content);
      setCopied(true);
      toast.success('Synthesis copied to clipboard');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Unable to copy. Please try again.');
    }
  };

  const copyAsMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      toast.success('Copied as markdown');
      setExportOpen(false);
    } catch {
      toast.error('Unable to copy markdown.');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([buildMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prismatic-synthesis.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
    toast.success('Downloaded prismatic-synthesis.md');
  };

  const shareResponse = async () => {
    try {
      let url = typeof window !== 'undefined' ? window.location.href : '';
      if (conversationId) {
        const shared = await conversationPersistence.setShared(conversationId, true);
        if (shared) {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          url = `${origin}/results?c=${conversationId}`;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: 'Prismatic synthesis', text: fusion.content.slice(0, 240), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(conversationId ? 'Share link copied' : 'Link copied to clipboard');
      }
    } catch {
      // user cancelled share; no feedback needed
    }
  };

  const confidencePercentage = Math.round(fusion.confidence * 100);

  // Calculate total for percentage normalization
  const totalSources = fusion.sources.grok + fusion.sources.claude + fusion.sources.gemini;
  
  // Calculate percentages
  const contributions = [
    {
      name: 'Claude',
      percentage: Math.round((fusion.sources.claude / totalSources) * 100),
      color: 'bg-amber-500',
      lightColor: 'bg-amber-500/15',
      textColor: 'text-amber-300'
    },
    { 
      name: 'Grok', 
      percentage: Math.round((fusion.sources.grok / totalSources) * 100),
      color: 'bg-slate-500',
      lightColor: 'bg-slate-500/20',
      textColor: 'text-slate-400'
    },
    { 
      name: 'Gemini', 
      percentage: Math.round((fusion.sources.gemini / totalSources) * 100),
      color: 'bg-blue-500',
      lightColor: 'bg-blue-500/20',
      textColor: 'text-blue-400'
    }
  ].sort((a, b) => b.percentage - a.percentage); // Sort by highest contribution first

  return (
    <div className="space-y-6">
      {/* Main Fusion Response - flat, borderless */}
      <Card className="group rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="pb-3 px-0 pt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-medium text-gray-500">Synthesis</span>
              <div className="flex items-center gap-1.5">
                {contributions.map((contribution) => (
                  <TooltipProvider key={contribution.name} delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${contribution.color} cursor-default`}
                          aria-label={`${contribution.name} ${contribution.percentage}%`}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-950/95 border border-white/10 text-gray-200">
                        {contribution.name} · {contribution.percentage}%
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[11px] text-gray-500 tabular-nums cursor-default">
                      {confidencePercentage}% confidence
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-950/95 border border-white/10 text-gray-200 max-w-sm p-3.5 w-[320px]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-white font-medium text-sm">
                        Synthesis Confidence
                      </div>
                      <div className="text-cyan-300 font-semibold text-sm tabular-nums">
                        {confidencePercentage}%
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-teal-400"
                        style={{ width: `${confidencePercentage}%` }}
                      />
                    </div>

                    <div className="text-gray-300 text-xs space-y-1">
                      <div className="font-medium text-cyan-300 mb-1">Score rationale</div>
                      {getConfidenceRationale(confidencePercentage).map((reason, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-cyan-300 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="font-medium text-cyan-300 text-xs mb-1">Quality breakdown</div>
                      {[
                        { label: 'Consensus', value: confidencePercentage },
                        {
                          label: 'Coverage',
                          value: Math.min(
                            100,
                            Math.round(confidencePercentage * 0.6 + contributions.length * 10)
                          ),
                        },
                        {
                          label: 'Source reliability',
                          value: Math.min(100, Math.round(confidencePercentage * 0.9 + 8)),
                        },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-2 text-[11px]">
                          <span className="text-gray-400 w-28 flex-shrink-0">{row.label}</span>
                          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400/70"
                              style={{ width: `${row.value}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-gray-300 w-8 text-right">
                            {row.value}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="font-medium text-cyan-300 text-xs mb-1">Model contributions</div>
                      {contributions.map((c) => (
                        <div key={c.name} className="flex items-center gap-2 text-[11px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                          <span className="text-gray-300 w-14 flex-shrink-0">{c.name}</span>
                          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full ${c.color}`}
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-gray-300 w-8 text-right">
                            {c.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div
                className="flex items-center gap-1 relative opacity-0 group-hover:opacity-100 transition-opacity"
                ref={exportRef}
              >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExportOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-label="Export synthesis"
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-800 focus-visible:ring-1 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </Button>
              {exportOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 min-w-[180px] rounded-lg border border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-2xl z-50 overflow-hidden"
                >
                  <button
                    role="menuitem"
                    onClick={copyAsMarkdown}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:bg-gray-800 text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    Copy as markdown
                  </button>
                  <button
                    role="menuitem"
                    onClick={downloadMarkdown}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:bg-gray-800 text-left border-t border-gray-800"
                  >
                    <FileDown className="w-3.5 h-3.5 text-gray-400" />
                    Download .md file
                  </button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={shareResponse}
                aria-label="Share synthesis"
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-800 focus-visible:ring-1 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                aria-label="Copy synthesis"
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-800 relative focus-visible:ring-1 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
              >
                {copied ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                )}
              </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-7 p-0 pt-1">
          {/* Key Insights - shown above the answer as a quick-read summary */}
          {fusion.keyInsights.length > 0 && (
            <div className="pb-5 mb-1 border-b border-white/5 space-y-2.5 sm:space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-cyan-300/80 font-medium flex items-center gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-cyan-400" />
                Key insights
              </div>
              {fusion.keyInsights.map((insight, index) => {
                const contested = isInsightContested(insight, structured);
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-gray-100"
                  >
                    <div
                      className={`flex-shrink-0 mt-[9px] w-[5px] h-[5px] rounded-full ${
                        contested
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]'
                          : 'bg-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.45)]'
                      }`}
                    />
                    <span className="leading-[1.7] text-sm sm:text-[15px] font-normal">
                      {insight}
                      {contested && (
                        <span className="ml-2 text-[11px] uppercase tracking-wider text-amber-300/80">· contested</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Content - Left aligned markdown, full-width */}
          <div className="prismatic-synthesis-body text-[15px] sm:text-base leading-[1.75] text-gray-100 font-normal tracking-normal text-left w-full">
            <Markdown>{fusion.content}</Markdown>
          </div>

          {/* Reaction feedback */}
          {turnId && conversationId && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">Was this helpful?</span>
              <button
                onClick={() => handleReaction('up')}
                aria-label="Mark helpful"
                aria-pressed={reaction === 'up'}
                className={`inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                  reaction === 'up'
                    ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                    : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-cyan-200 hover:border-cyan-400/40'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleReaction('down')}
                aria-label="Mark not helpful"
                aria-pressed={reaction === 'down'}
                className={`inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 ${
                  reaction === 'down'
                    ? 'border-rose-400/50 bg-rose-400/15 text-rose-200'
                    : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-rose-200 hover:border-rose-400/40'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {memoryUsed && memoryUsed.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-800/50">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Memory used in this turn
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {memoryUsed.map((fact, i) => (
                  <span
                    key={i}
                    title={fact}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 max-w-xs truncate"
                  >
                    {fact.length > 64 ? `${fact.slice(0, 64)}…` : fact}
                  </span>
                ))}
              </div>
            </div>
          )}

          {structured && structured.sentences && structured.sentences.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-800/50">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500/50" aria-hidden="true" />
                Sentence-level citations
              </h4>
              <div className="space-y-2">
                {structured.sentences.map((s, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">{s.text}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.supported_by.map((m) => (
                          <span
                            key={`sup-${m}`}
                            className={`px-1.5 py-0.5 text-[10px] rounded border ${modelBadgeColor[m]}`}
                          >
                            {m}
                          </span>
                        ))}
                        {s.contested_by?.map((m) => (
                          <span
                            key={`con-${m}`}
                            className="px-1.5 py-0.5 text-[10px] rounded border bg-red-500/10 text-red-300 border-red-500/40"
                            title="Contested by this model"
                          >
                            !{m}
                          </span>
                        ))}
                      </div>
                    </div>
                    {canPin && onPinFact && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onPinFact(s.text);
                          toast.success('Pinned to project memory');
                        }}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
                        title="Pin to project memory"
                        aria-label="Pin sentence to project memory"
                      >
                        <Pin className="w-3.5 h-3.5 text-cyan-300" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {structured.disagreements && structured.disagreements.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-orange-300 uppercase tracking-wider">Disagreements</h5>
                  {structured.disagreements.map((d, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-xs font-medium text-orange-200 mb-1">{d.topic}</p>
                      <div className="space-y-0.5">
                        {d.positions.map((p, j) => (
                          <p key={j} className="text-[11px] text-gray-300">
                            <span className={`inline-block px-1 py-0 text-[9px] rounded mr-1 border ${modelBadgeColor[p.model]}`}>
                              {p.model}
                            </span>
                            {p.stance}
                          </p>
                        ))}
                      </div>
                      {d.resolution && (
                        <p className="text-[11px] text-gray-400 mt-1 italic">→ {d.resolution}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}