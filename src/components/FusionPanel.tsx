import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import { Copy, Shield, Clock, Zap, Target, Lightbulb, Check, Share2, Download, FileDown } from 'lucide-react';
import { FusionResult } from '../types';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Markdown } from '../utils/markdown';
import { conversationPersistence } from '../services/conversationPersistence';

interface FusionPanelProps {
  fusion: FusionResult;
  conversationId?: string;
}

const confidenceChartConfig = {
  confidence: {
    label: "Synthesis Confidence",
    color: "#3B82F6",
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

export function FusionPanel({ fusion, conversationId }: FusionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

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

  const buildMarkdown = () =>
    `# Prismatic synthesis\n\n` +
    `> Confidence: ${Math.round(fusion.confidence * 100)}%\n\n` +
    (fusion.keyInsights.length
      ? `## Key insights\n\n${fusion.keyInsights.map((k) => `- ${k}`).join('\n')}\n\n`
      : '') +
    `## Response\n\n${fusion.content}\n`;

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
      color: 'bg-purple-500',
      lightColor: 'bg-purple-500/20',
      textColor: 'text-purple-400'
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
      {/* Main Fusion Response Card - No background or border */}
      <Card className="rounded-lg" style={{ backgroundColor: '#090C14' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
              <CardTitle className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl max-w-xs">
                          <div className="text-white font-medium text-sm mb-2">
                            Synthesis Confidence: {confidence}%
                          </div>
                          <div className="text-gray-300 text-xs space-y-1">
                            <div className="font-medium text-blue-400 mb-1">Score Rationale:</div>
                            {rationale.map((reason, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
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
            <div className="p-2 sm:p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 space-y-2 sm:space-y-2.5">
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
        </CardContent>
      </Card>
    </div>
  );
}