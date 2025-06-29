import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Copy, Clock, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AIResponse } from '../types';
import { cn } from '@/lib/utils';

interface AIResponsePanelProps {
  response: AIResponse;
}

const platformConfig = {
  grok: {
    name: 'Grok',
    color: 'bg-slate-400',
    lightColor: 'bg-slate-950/30',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-800'
  },
  claude: {
    name: 'Claude',
    color: 'bg-purple-400', 
    lightColor: 'bg-purple-950/30',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-800'
  },
  gemini: {
    name: 'Gemini',
    color: 'bg-blue-400',
    lightColor: 'bg-blue-950/30', 
    textColor: 'text-blue-400',
    borderColor: 'border-blue-800'
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
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(response.content);
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(1)}s`;
  };

  if (response.loading) {
    return (
      <motion.div
        variants={loadingVariants}
        initial="initial"
        animate="animate"
      >
        <Card className={cn('h-[320px] sm:h-[400px] flex flex-col bg-gray-900/50 shadow-xl rounded-lg', config.borderColor, 'border')}>
          <CardHeader className={cn('pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-6', config.lightColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={pulseAnimation}
                  className={cn('w-3 h-3 rounded-full', config.color)} 
                />
                <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
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
                Generating response...
              </motion.p>
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
        <Card className={cn('h-[320px] sm:h-[400px] flex flex-col bg-gray-900/50 shadow-xl rounded-lg border-red-800 border')}>
          <CardHeader className="pb-2 sm:pb-3 bg-red-950/30 flex-shrink-0 p-3 sm:p-6">
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
            <div className="flex flex-col items-center justify-center text-red-400">
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
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className={cn('h-[320px] sm:h-[400px] flex flex-col bg-gray-900/50 shadow-xl rounded-lg', config.borderColor, 'border')}>
        <CardHeader className={cn('pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-6', config.lightColor)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn('w-3 h-3 rounded-full', config.color)} 
              />
              <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-800"
              >
                <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
              </Button>
            </motion.div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Confidence</span>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={cn('text-xs font-semibold', config.textColor)}
              >
                {Math.round(response.confidence * 100)}%
              </motion.span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Progress 
                value={response.confidence * 100} 
                className="h-1.5"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-2 sm:gap-3 text-xs text-gray-500"
            >
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {formatResponseTime(response.responseTime)}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {response.wordCount} words
              </div>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-3 sm:p-4">
          <div className="h-full overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="ai-response-text beautiful-text whitespace-pre-wrap text-xs sm:text-sm"
            >
              {response.content}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}