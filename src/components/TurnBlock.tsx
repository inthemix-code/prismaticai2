import { useState, useEffect, forwardRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar as BarChart3, Users, ChevronDown, ChevronUp, Clock, Scale } from 'lucide-react';
import { ConversationTurn, Conversation } from '../types';
import { AnalyticsCharts } from './AnalyticsCharts';
import { FusionPanel } from './FusionPanel';
import { FusionPanelSkeleton } from './FusionPanelSkeleton';
import { JudgeVerdictCard } from './JudgeVerdictCard';
import { JudgeVerdictCardSkeleton } from './JudgeVerdictCardSkeleton';
import { AIResponsePanel } from './AIResponsePanel';
import { AIResponsePanelSkeleton } from './AIResponsePanelSkeleton';
import { ForkIndicator } from './ForkIndicator';

interface TurnBlockProps {
  turn: ConversationTurn;
  turnIndex: number;
  isLatest: boolean;
  conversation: Conversation;
  activeProjectId: string | null;
  onPinFact: (fact: string, turnId: string) => void;
  referenceCollapsedDefault: boolean;
  autoCollapseOlder: boolean;
  responsesLayout: 'compact' | 'expanded';
  onToggleResponsesLayout: () => void;
  formatTimestamp: (t: number) => string;
}

const TurnBlockInner = forwardRef<HTMLDivElement, TurnBlockProps>(function TurnBlockInner(
  {
    turn,
    turnIndex,
    isLatest,
    conversation,
    activeProjectId,
    onPinFact,
    referenceCollapsedDefault,
    autoCollapseOlder,
    responsesLayout,
    onToggleResponsesLayout,
    formatTimestamp,
  },
  ref
) {
  const [referenceOpen, setReferenceOpen] = useState(!referenceCollapsedDefault && isLatest);
  const [turnCollapsed, setTurnCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'responses' | 'judge'>('analytics');

  useEffect(() => {
    if (autoCollapseOlder && !isLatest && !turn.loading) {
      setTurnCollapsed(true);
    } else if (isLatest) {
      setTurnCollapsed(false);
    }
  }, [isLatest, autoCollapseOlder, turn.loading]);

  const hasReferenceData = !!turn.analysisData && !turn.loading;
  const responsesGrid =
    responsesLayout === 'expanded'
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5'
      : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group relative"
    >
      {/* Turn meta strip */}
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-3">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="font-medium text-gray-400">Turn {turnIndex + 1}</span>
          <span className="text-gray-700">&middot;</span>
          <span className="flex items-center gap-1 normal-case tracking-normal">
            <Clock className="w-3 h-3" />
            {formatTimestamp(turn.timestamp)}
          </span>
          {!turn.loading && (
            <>
              <span className="text-gray-700">&middot;</span>
              <span className="normal-case tracking-normal">{turn.responses.length} models</span>
            </>
          )}
        </div>
        {!turn.loading && !isLatest && (
          <button
            onClick={() => setTurnCollapsed((v) => !v)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors normal-case tracking-normal"
          >
            {turnCollapsed ? (
              <>
                <ChevronDown className="w-3 h-3" /> Expand
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" /> Collapse
              </>
            )}
          </button>
        )}
      </div>

      {/* Question (always visible, lighter weight) */}
      <div className="relative pl-4 border-l border-white/5 py-1 mb-5">
        <div className="flex items-start gap-3">
          <p
            className={`flex-1 min-w-0 text-sm sm:text-[15px] text-gray-300 leading-relaxed break-words ${
              turnCollapsed ? 'line-clamp-1' : ''
            }`}
          >
            {turn.prompt}
          </p>
          {!turn.loading && (
            <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
              {(turn.siblingCount ?? 1) > 1 && (
                <ForkIndicator
                  conversationId={conversation.id}
                  turnId={turn.id}
                  parentTurnId={turn.parentTurnId ?? null}
                  siblingIndex={turn.siblingIndex ?? 0}
                  siblingCount={turn.siblingCount ?? 1}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!turnCollapsed && (
          <motion.div
            key="turn-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Loading */}
            {turn.loading && (
              <div className="space-y-4">
                <FusionPanelSkeleton />
                <div className="text-xs text-gray-500 pl-1 animate-pulse">Preparing analytics...</div>
              </div>
            )}

            {/* Fusion hero */}
            {!turn.loading && turn.fusionResult && (
              <motion.div
                data-fusion-panel
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="relative"
              >
                <div className="absolute -left-3 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400/60 via-blue-500/40 to-transparent rounded-full hidden sm:block" />
                <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wider text-cyan-300/80 font-medium">
                  <span className="inline-block w-1 h-1 rounded-full bg-cyan-400" />
                  Answer
                </div>
                <FusionPanel
                  fusion={turn.fusionResult}
                  conversationId={conversation.id}
                  turnId={turn.id}
                  structured={turn.fusionStructured ?? null}
                  memoryUsed={turn.memoryUsed}
                  canPin={!!activeProjectId}
                  onPinFact={(fact) => onPinFact(fact, turn.id)}
                  judgeVerdict={turn.judgeVerdict ?? null}
                />
              </motion.div>
            )}

            {/* Reference material (collapsed by default) */}
            {hasReferenceData && (
              <div className="mt-6 border-t border-gray-800/60 pt-5">
                <button
                  onClick={() => setReferenceOpen((v) => !v)}
                  aria-expanded={referenceOpen}
                  className="w-full flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                      Reference
                    </span>
                    <span className="text-xs text-gray-600">
                      Analytics, responses &amp; judge verdict
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                    {referenceOpen ? 'Hide details' : 'Show details'}
                    {referenceOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {referenceOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'analytics' | 'responses' | 'judge')}>
                          <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-white/[0.03] border border-white/10 backdrop-blur-sm h-8">
                              <TabsTrigger value="analytics" className="text-xs h-6 px-2.5">
                                <BarChart3 className="w-3 h-3 mr-1.5" />
                                Analytics
                              </TabsTrigger>
                              <TabsTrigger value="responses" className="text-xs h-6 px-2.5">
                                <Users className="w-3 h-3 mr-1.5" />
                                Responses
                              </TabsTrigger>
                              <TabsTrigger value="judge" className="text-xs h-6 px-2.5">
                                <Scale className="w-3 h-3 mr-1.5" />
                                Judge
                              </TabsTrigger>
                            </TabsList>
                            {activeTab === 'responses' && (
                              <button
                                onClick={onToggleResponsesLayout}
                                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                {responsesLayout === 'expanded' ? 'Compact view' : 'Expanded view'}
                              </button>
                            )}
                          </div>

                          <TabsContent value="analytics" className="mt-0">
                            {turn.analysisData && (
                              <AnalyticsCharts
                                data={turn.analysisData}
                                fusionSources={turn.fusionResult?.sources}
                              />
                            )}
                          </TabsContent>

                          <TabsContent value="responses" className="mt-0">
                            <div className={responsesGrid}>
                              {turn.responses.map((response, i) => (
                                <motion.div
                                  key={response.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: 0.03 * i }}
                                >
                                  <AIResponsePanel response={response} />
                                </motion.div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="judge" className="mt-0">
                            {turn.judgeVerdict ? (
                              <JudgeVerdictCard
                                verdict={turn.judgeVerdict}
                                turnId={turn.id}
                                loading={turn.judgeLoading}
                                evaluatedModels={turn.responses
                                  .filter((r) => r.content && !r.error)
                                  .map((r) => r.platform)}
                              />
                            ) : turn.judgeLoading ? (
                              <JudgeVerdictCardSkeleton />
                            ) : (
                              <div className="text-xs text-gray-500 py-6 text-center border border-dashed border-white/10 rounded-lg">
                                Judge has not evaluated this turn yet.
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Skeleton reference while loading */}
            {turn.loading && turn.responses.length > 0 && (
              <div className="mt-6 border-t border-gray-800/60 pt-5">
                <div className="text-[11px] uppercase tracking-wider text-gray-600 font-medium mb-3">
                  Reference (preparing)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {turn.responses.map((response) => (
                    <AIResponsePanelSkeleton key={response.id} platform={response.platform} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export const TurnBlock = memo(TurnBlockInner, (prev, next) => {
  if (prev.turn !== next.turn) return false;
  if (prev.turnIndex !== next.turnIndex) return false;
  if (prev.isLatest !== next.isLatest) return false;
  if (prev.conversation.id !== next.conversation.id) return false;
  if (prev.activeProjectId !== next.activeProjectId) return false;
  if (prev.referenceCollapsedDefault !== next.referenceCollapsedDefault) return false;
  if (prev.autoCollapseOlder !== next.autoCollapseOlder) return false;
  if (prev.responsesLayout !== next.responsesLayout) return false;
  if (prev.onPinFact !== next.onPinFact) return false;
  if (prev.onToggleResponsesLayout !== next.onToggleResponsesLayout) return false;
  if (prev.formatTimestamp !== next.formatTimestamp) return false;
  return true;
});
