import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Loader2 } from 'lucide-react';

export function FusionPanelSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-lg" style={{ backgroundColor: '#090C14' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI Synthesis Response
                </span>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              </div>
              
              {/* Model contribution pills skeleton */}
              <div className="flex flex-wrap gap-1 sm:gap-2 ml-2 sm:ml-4">
                {['Claude', 'Grok', 'Gemini'].map((model) => (
                  <div
                    key={model}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border bg-white/5 border-gray-600/50"
                  >
                    <Skeleton className="w-1.5 h-1.5 rounded-full" />
                    <Skeleton className="h-3 w-8 sm:w-12" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Synthesis Confidence</span>
              <span className="text-xs text-gray-400">Calculating...</span>
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Key Insights skeleton */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
              <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Key Insights
              <span className="text-xs text-gray-500 normal-case">(Extracting...)</span>
            </h4>
            <div className="p-2 sm:p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 space-y-2 sm:space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-2.5">
                  <Skeleton className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">Synthesizing responses...</span>
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <div className="pt-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-2 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
              <div className="pt-2">
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-2 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}