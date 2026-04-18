import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import { Copy, Shield, Clock, Zap, Target, Lightbulb, Check, Share2, Download, FileDown, Pin, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';
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

const confidenceChartConfig = {
  confidence: {
    label: "Synthesis Confidence",
    color: "#06B6D4",
  },
} satisfies ChartConfig;

// Dynamic icons for key insights
const getInsightIcon = (insight: string, index: number) => {
  const lowerInsight = insight.toLowerCase();
  
  if (lowerInsight.includes('quantum') || lowerInsight.includes('break') || lowerInsight.includes('encryption')) {
    return <Shield className="w-3.5 h-3.5 text-red-400" />;
  }
  if (lowerInsight.includes('time') || lowerInsight.includes('year') || lowerInsight.includes('timeline')) {
    return <Clock className="w-3.5 h-3.5 text-blue-400" />;
  }
  if (lowerInsight.includes('standard') || lowerInsight.includes('nist') || lowerInsight.includes('available')) {
    return <Target className="w-3.5 h-3.5 text-green-400" />;
  }
  if (lowerInsight.includes('organization') || lowerInsight.includes('planning') || lowerInsight.includes('immediately')) {
    return <Zap className="w-3.5 h-3.5 text-orange-400" />;
  }
  
  // Default icons based on index
  const defaultIcons = [
    <Shield className="w-3.5 h-3.5 text-blue-400" />,
    <Target className="w-3.5 h-3.5 text-green-400" />,
    <Clock className="w-3.5 h-3.5 text-purple-400" />,
    <Zap className="w-3.5 h-3.5 text-orange-400" />
  ];
  
  return defaultIcons[index % defaultIcons.length];
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

  // Prepare data for the confidence chart
  const confidencePercentage = Math.round(fusion.confidence * 100);
  const confidenceData = [
    {
      metric: "Synthesis",
      confidence: confidencePercentage,
    },
  ];

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
      {/* Main Fusion Response Card - glass surface */}
      <Card className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-[0_0_32px_-12px_rgba(6,182,212,0.35)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              <CardTitle className="text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                AI Synthesis Response
              </CardTitle>
              {/* Model Contributions Pills */}
              <div className="flex flex-wrap gap-1 sm:gap-2 ml-2 sm:ml-4">
                {contributions.map((contribution) => (
                  <div
                    key={contribution.name}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${contribution.lightColor} border-gray-600/50`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${contribution.color}`} />
                    <span className={`text-xs font-medium ${contribution.textColor} hidden sm:inline`}>
                      {contribution.name}
                    </span>
                    <span className={`text-xs font-semibold text-white ${contribution.textColor} sm:text-white`}>
                      <span className="sm:hidden">{contribution.name.charAt(0)}</span>
                      {contribution.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 relative" ref={exportRef}>
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
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Synthesis Confidence</span>
            </div>
            <ChartContainer
              config={confidenceChartConfig}
              className="h-[15px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={confidenceData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 15,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid horizontal={false} stroke="#374151" />
                <YAxis
                  dataKey="metric"
                  type="category"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  hide
                />
                <XAxis 
                  dataKey="confidence"
                  type="number"
                  domain={[0, 100]}
                  hide
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const confidence = payload[0].value as number;
                      
                      // Generate rationale based on confidence level
                      const getRationale = (score: number) => {
                        if (score >= 90) {
                          return [
                            "High consensus across all AI models",
                            "Consistent factual information",
                            "Comprehensive topic coverage",
                            "Strong source reliability"
                          ];
                        } else if (score >= 80) {
                          return [
                            "Good agreement between models",
                            "Most information is consistent",
                            "Minor gaps in coverage",
                            "Reliable but some uncertainty"
                          ];
                        } else if (score >= 70) {
                          return [
                            "Moderate consensus achieved",
                            "Some conflicting viewpoints",
                            "Reasonable topic coverage",
                            "Generally trustworthy sources"
                          ];
                        } else if (score >= 60) {
                          return [
                            "Limited agreement between models",
                            "Notable information conflicts",
                            "Partial topic coverage",
                            "Mixed source reliability"
                          ];
                        } else {
                          return [
                            "Low consensus across models",
                            "Significant contradictions found",
                            "Incomplete information",
                            "Uncertain source quality"
                          ];
                        }
                      };
                      
                      const rationale = getRationale(confidence);
                      
                      return (
                        <div className="bg-gray-950/95 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-2xl max-w-xs">
                          <div className="text-white font-medium text-sm mb-2">
                            Synthesis Confidence: {confidence}%
                          </div>
                          <div className="text-gray-300 text-xs space-y-1">
                            <div className="font-medium text-cyan-300 mb-1">Score Rationale:</div>
                            {rationale.map((reason, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-cyan-300 rounded-full mt-1.5 flex-shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="confidence"
                  layout="vertical"
                  fill="var(--color-confidence)"
                  radius={2}
                >
                  <LabelList
                    dataKey="confidence"
                    position="right"
                    offset={6}
                    className="fill-white"
                    fontSize={9}
                    formatter={(value: number) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Key Insights - Consolidated into single rectangle */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
              <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Key Insights
            </h4>
            <div className="p-2 sm:p-3 bg-white/[0.03] rounded-xl border border-white/10 space-y-2 sm:space-y-2.5">
              {fusion.keyInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 sm:gap-2.5 text-xs text-gray-300"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight, index)}
                  </div>
                  <span className="leading-relaxed font-light tracking-wide text-xs sm:text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Left aligned markdown */}
          <div className="text-xs sm:text-sm leading-relaxed text-gray-300 font-light tracking-wide text-left max-w-[72ch]">
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
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
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
                <Target className="w-3.5 h-3.5 text-blue-400" />
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