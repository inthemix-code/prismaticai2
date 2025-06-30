import { TrendingUp, Shield, Zap, Target, BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsChartsSkeleton() {
  const chartCards = [
    {
      icon: TrendingUp,
      title: "Response Confidence",
      description: "Confidence scores by platform",
      status: "Calculating..."
    },
    {
      icon: Target,
      title: "Attribution Sources", 
      description: "Model contributions to synthesis",
      status: "Analyzing..."
    },
    {
      icon: BarChart3,
      title: "Sentiment Analysis",
      description: "Emotional tone comparison", 
      status: "Processing..."
    },
    {
      icon: Zap,
      title: "Efficiency Analysis",
      description: "Conciseness vs redundancy",
      status: "Computing..."
    },
    {
      icon: Shield,
      title: "Risk Assessment", 
      description: "Reliability indicators",
      status: "Evaluating..."
    },
    {
      icon: Target,
      title: "Differentiation Analysis",
      description: "Originality metrics",
      status: "Measuring..."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Individual Chart Cards */}
      {chartCards.map((chart, index) => (
        <Card key={index} className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <chart.icon className="h-4 w-4 text-blue-400" />
              {chart.title}
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {chart.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[160px] w-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Skeleton className="h-24 w-32 mx-auto" />
                <div className="text-xs text-gray-500">{chart.status}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
            <div className="flex gap-2 leading-none font-medium text-white text-xs">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-3" />
            </div>
            <Skeleton className="h-3 w-20" />
          </CardFooter>
        </Card>
      ))}

      {/* Top Keywords Chart - Full Width */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg md:col-span-2 xl:col-span-3">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            Top Keywords
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Most frequently used terms across platforms (Extracting...)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[160px] w-full space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <div className="flex-1 flex gap-2">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-3" />
          </div>
          <Skeleton className="h-3 w-32" />
        </CardFooter>
      </Card>
    </div>
  );
}
</thinking>

I'll implement the labeled skeleton loaders to replace the loading animation. This will provide a better user experience by showing the structure of content that\'s being prepared.

<boltArtifact id="labeled-skeleton-loaders" title="Implement labeled skeleton loaders">