import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CircleAlert as AlertCircle, Loader as Loader2, Check, ChevronDown } from 'lucide-react';
import { AIResponse } from '../types';
import { cn } from '@/lib/utils';
import { Markdown } from '../utils/markdown';

interface AIResponsePanelProps {
  response: AIResponse;
}

const platformConfig = {
  grok: {
    name: 'Grok',
    color: 'bg-slate-300',
    lightColor: 'bg-slate-400/10',
    textColor: 'text-slate-200',
    borderColor: 'border-white/10',
    accent: 'from-slate-400/40 to-transparent'
  },
  claude: {
    name: 'Claude',
    color: 'bg-amber-300',
    lightColor: 'bg-amber-400/10',
    textColor: 'text-amber-200',
    borderColor: 'border-white/10',
    accent: 'from-amber-400/50 to-transparent'
  },
  gemini: {
    name: 'Gemini',
    color: 'bg-blue-300',
    lightColor: 'bg-blue-400/10',
    textColor: 'text-blue-200',
    borderColor: 'border-white/10',
    accent: 'from-blue-400/50 to-transparent'
  }
};

const loadingVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      delay: 0.2
    }
  }
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

export function AIResponsePanel({ response }: AIResponsePanelProps) {
  const config = platformConfig[response.platform];
  const shouldReduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      toast.success(`${config.name} response copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Unable to copy. Please try again.');
    }
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(1)}s`;
  };

  const isStreamingWithContent = response.loading && response.streaming && response.content;

  if (response.loading && !isStreamingWithContent) {
    return (
      <motion.div
        variants={loadingVariants}
        initial="initial"
        animate="animate"
      >
        <Card className={cn('relative h-[320px] sm:h-[400px] flex flex-col bg-white/[0.03] backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden', config.borderColor, 'border')}>
          <div className={cn('absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r', config.accent)} />
          <CardHeader className={cn('pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-6', config.lightColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={pulseAnimation}
                  className={cn('w-3 h-3 rounded-full', config.color)}
                />
                <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
                {response.streaming && (
                  <Badge variant="secondary" className="text-[10px] bg-cyan-950/50 text-cyan-300 border-cyan-800">
                    Streaming
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-3 sm:p-6">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-gray-400 text-center"
              >
                {response.streaming ? 'Awaiting first token...' : 'Generating response...'}
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isStreamingWithContent) {
    return (
      <motion.div variants={loadingVariants} initial="initial" animate="animate">
        <Card className={cn('relative h-[320px] sm:h-[400px] flex flex-col bg-white/[0.03] backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden', config.borderColor, 'border')}>
          <div className={cn('absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r', config.accent)} />
          <CardHeader className={cn('pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-6', config.lightColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={pulseAnimation}
                  className={cn('w-3 h-3 rounded-full', config.color)}
                />
                <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
                <Badge variant="secondary" className="text-[10px] bg-cyan-950/50 text-cyan-300 border-cyan-800">
                  Streaming
                </Badge>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-3 sm:p-4">
            <div className="h-full overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
              <div className="ai-response-text beautiful-text text-xs sm:text-sm">
                <Markdown>{response.content}</Markdown>
                <span className="inline-block w-[2px] h-3 ml-0.5 bg-cyan-300 animate-pulse align-middle" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (response.error) {
    return (
      <motion.div
        variants={loadingVariants}
        initial="initial"
        animate="animate"
      >
        <Card className={cn('relative h-[320px] sm:h-[400px] flex flex-col bg-white/[0.03] backdrop-blur-sm shadow-xl rounded-2xl border border-rose-500/30 overflow-hidden')}>
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-400/70 to-transparent" />
          <CardHeader className="pb-2 sm:pb-3 bg-rose-500/10 flex-shrink-0 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', config.color)} />
                <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-3 sm:p-6">
            <div className="flex flex-col items-center justify-center text-rose-200">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
              <p className="text-xs text-center px-2">{response.error}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={contentVariants}
      initial="initial"
      animate="animate"
      whileHover={shouldReduce ? undefined : { y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={cn(
          'group relative flex flex-col bg-gray-900/50 shadow-xl rounded-lg transition-[height] duration-300',
          expanded ? 'h-auto' : 'h-[320px] sm:h-[400px]',
          config.borderColor,
          'border'
        )}
      >
        <CardHeader className={cn('pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-4', config.lightColor)}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn('w-2 h-2 rounded-full flex-shrink-0', config.color)}
              />
              <h4 className="text-white text-xs sm:text-sm font-medium truncate">{config.name}</h4>
              {response.isMock && (
                <Badge variant="secondary" className="text-[10px] bg-yellow-900/50 text-yellow-400 border-yellow-700">
                  Mock
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 tabular-nums">
                {formatResponseTime(response.responseTime)} · {Math.round(response.confidence * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                aria-label={`Copy ${config.name} response`}
                className="h-6 w-6 p-0 opacity-40 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-gray-800 focus-visible:ring-1 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-3 sm:p-4 relative">
          <div
            className={cn(
              'h-full pr-1 sm:pr-2',
              expanded ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
            )}
            style={
              !expanded
                ? {
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)',
                  }
                : undefined
            }
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: shouldReduce ? 0 : 0.8, duration: shouldReduce ? 0 : 0.6 }}
              className="ai-response-text beautiful-text text-xs sm:text-sm"
            >
              <Markdown>{response.content}</Markdown>
            </motion.div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse response' : 'Expand response'}
            aria-expanded={expanded}
            className="absolute bottom-2 right-2 h-7 w-7 inline-flex items-center justify-center rounded-full border border-white/10 bg-gray-900/80 backdrop-blur-sm text-gray-400 hover:text-white hover:border-white/20 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60"
          >
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}