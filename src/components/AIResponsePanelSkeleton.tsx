import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Zap, Diamond, Loader as Loader2 } from 'lucide-react';

interface AIResponsePanelSkeletonProps {
  platform: 'claude' | 'grok' | 'gemini';
}

const platformConfig = {
  grok: {
    name: 'Grok',
    icon: Zap,
    color: 'bg-slate-300',
    lightColor: 'bg-slate-400/10',
    textColor: 'text-slate-200',
    accent: 'from-slate-400/40 to-transparent'
  },
  claude: {
    name: 'Claude',
    icon: Bot,
    color: 'bg-amber-300',
    lightColor: 'bg-amber-400/10',
    textColor: 'text-amber-200',
    accent: 'from-amber-400/50 to-transparent'
  },
  gemini: {
    name: 'Gemini',
    icon: Diamond,
    color: 'bg-blue-300',
    lightColor: 'bg-blue-400/10',
    textColor: 'text-blue-200',
    accent: 'from-blue-400/50 to-transparent'
  }
};

export function AIResponsePanelSkeleton({ platform }: AIResponsePanelSkeletonProps) {
  const config = platformConfig[platform];

  return (
    <Card className={`relative h-[320px] sm:h-[400px] flex flex-col bg-white/[0.03] backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 overflow-hidden`}>
      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${config.accent}`} />
      <CardHeader className={`pb-2 sm:pb-3 flex-shrink-0 p-3 sm:p-6 ${config.lightColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <h4 className="text-white text-xs sm:text-sm font-medium">{config.name}</h4>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-gray-400" />
          </div>
          <Skeleton className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Confidence</span>
            <span className="text-xs text-gray-500">Computing...</span>
          </div>
          <Skeleton className="h-1.5 w-full" />
          
          <div className="flex gap-2 sm:gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <config.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Thinking...</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-3 sm:p-4">
        <div className="h-full space-y-2">
          <div className="text-xs text-gray-500 mb-3">Generating response...</div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/5" />
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}