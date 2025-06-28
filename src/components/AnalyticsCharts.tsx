import React from 'react';
import { TrendingUp, Shield, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, ResponsiveContainer, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AnalysisData } from '../types';

interface AnalyticsChartsProps {
  data: AnalysisData;
  fusionSources?: {
    grok: number;
    claude: number;
    gemini: number;
  };
}

const metricsChartConfig = {
  confidence: {
    label: "Confidence",
    color: "#3B82F6",
  },
  label: {
    color: "#FFFFFF",
  },
} satisfies ChartConfig;

const sentimentChartConfig = {
  positive: {
    label: "Positive",
    color: "#10B981",
  },
  neutral: {
    label: "Neutral", 
    color: "#8B5CF6",
  },
  negative: {
    label: "Negative",
    color: "#EF4444",
  },
} satisfies ChartConfig;

const keywordChartConfig = {
  grok: {
    label: "Grok",
    color: "#64748B",
  },
  claude: {
    label: "Claude",
    color: "#8B5CF6",
  },
  gemini: {
    label: "Gemini",
    color: "#3B82F6",
  },
  label: {
    color: "#FFFFFF",
  },
} satisfies ChartConfig;

const efficiencyChartConfig = {
  conciseness: {
    label: "Conciseness",
    color: "#10B981",
  },
  redundancy: {
    label: "Redundancy Score",
    color: "#EF4444",
  },
} satisfies ChartConfig;

const riskChartConfig = {
  hallucination: {
    label: "Hallucination Risk",
    color: "#EF4444",
  },
  contradictions: {
    label: "Contradictions",
    color: "#F59E0B",
  },
  hedging: {
    label: "Confidence/Hedging",
    color: "#10B981",
  },
} satisfies ChartConfig;

const differentiationChartConfig = {
  originality: {
    label: "Originality",
    color: "#8B5CF6",
  },
  divergence: {
    label: "Divergence",
    color: "#3B82F6",
  },
  contribution: {
    label: "Contribution",
    color: "#10B981",
  },
} satisfies ChartConfig;

const attributionChartConfig = {
  grok: {
    label: "Grok",
    color: "#64748B",
  },
  claude: {
    label: "Claude", 
    color: "#8B5CF6",
  },
  gemini: {
    label: "Gemini",
    color: "#3B82F6",
  },
  label: {
    color: "#FFFFFF",
  },
} satisfies ChartConfig;

export function AnalyticsCharts({ data, fusionSources }: AnalyticsChartsProps) {
  // Transform fusion sources data for the chart
  const attributionData = fusionSources ? (() => {
    const total = fusionSources.grok + fusionSources.claude + fusionSources.gemini;
    return [
      {
        model: 'Claude',
        percentage: Math.round((fusionSources.claude / total) * 100),
        value: fusionSources.claude,
        fill: "var(--color-claude)"
      },
      {
        model: 'Gemini', 
        percentage: Math.round((fusionSources.gemini / total) * 100),
        value: fusionSources.gemini,
        fill: "var(--color-gemini)"
      },
      {
        model: 'Grok',
        percentage: Math.round((fusionSources.grok / total) * 100),
        value: fusionSources.grok,
        fill: "var(--color-grok)"
      }
    ].sort((a, b) => b.percentage - a.percentage);
  })() : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Response Confidence Chart */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white">Response Confidence</CardTitle>
          <CardDescription className="text-xs text-gray-500">Confidence scores by platform</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={metricsChartConfig}
            className="h-[160px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data.metrics}
              layout="vertical"
              margin={{
                top: 5,
                right: 20,
                left: 4,
                bottom: 4,
              }}
              width="100%"
              height={160}
            >
              <CartesianGrid horizontal={false} stroke="#374151" />
              <YAxis
                dataKey="platform"
                type="category"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 7)}
                hide
              />
              <XAxis dataKey="confidence" type="number" hide />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="confidence"
                layout="vertical"
                fill="var(--color-confidence)"
                radius={3}
              >
                <LabelList
                  dataKey="platform"
                  position="insideLeft"
                  offset={6}
                  className="fill-white"
                  fontSize={9}
                />
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
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            Claude leads <TrendingUp className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Quality metrics
          </div>
        </CardFooter>
      </Card>

      {/* Attribution Sources Chart */}
      {fusionSources && (
        <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
              <Target className="h-4 w-4 text-emerald-400" />
              Attribution Sources
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">Model contributions to synthesis</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer
              config={attributionChartConfig}
              className="h-[160px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={attributionData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 4,
                  bottom: 4,
                }}
                width="100%"
                height={160}
              >
                <CartesianGrid horizontal={false} stroke="#374151" />
                <YAxis
                  dataKey="model"
                  type="category"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 7)}
                  hide
                />
                <XAxis dataKey="percentage" type="number" hide />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="percentage"
                  layout="vertical"
                  radius={3}
                >
                  {attributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="model"
                    position="insideLeft"
                    offset={6}
                    className="fill-white"
                    fontSize={9}
                  />
                  <LabelList
                    dataKey="percentage"
                    position="right"
                    offset={6}
                    className="fill-white"
                    fontSize={9}
                    formatter={(value: number) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
            <div className="flex gap-2 leading-none font-medium text-white text-xs">
              {attributionData[0]?.model} leads <Target className="h-3 w-3" />
            </div>
            <div className="text-gray-500 leading-none text-xs">
              Synthesis contributions
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Sentiment Analysis Radar */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white">Sentiment Analysis</CardTitle>
          <CardDescription className="text-xs text-gray-500">Emotional tone comparison</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={sentimentChartConfig}
            className="h-[160px] w-full"
          >
            <RadarChart 
              data={data.sentiment}
              margin={{
                top: 10,
                right: 10,
                bottom: 10,
                left: 10,
              }}
              width="100%"
              height={160}
            >
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis 
                dataKey="platform" 
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                tickCount={3}
              />
              <Radar 
                name="Positive" 
                dataKey="positive" 
                stroke="var(--color-positive)" 
                fill="var(--color-positive)" 
                fillOpacity={0} 
                strokeWidth={2} 
              />
              <Radar 
                name="Neutral" 
                dataKey="neutral" 
                stroke="var(--color-neutral)" 
                fill="var(--color-neutral)" 
                fillOpacity={0} 
                strokeWidth={2} 
              />
              <Radar 
                name="Negative" 
                dataKey="negative" 
                stroke="var(--color-negative)" 
                fill="var(--color-negative)" 
                fillOpacity={0} 
                strokeWidth={2} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '8px', color: '#9CA3AF' }}
                iconSize={6}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            Balanced sentiment <TrendingUp className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Distribution patterns
          </div>
        </CardFooter>
      </Card>

      {/* Efficiency Analysis */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-400" />
            Efficiency Analysis
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Conciseness vs redundancy</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={efficiencyChartConfig}
            className="h-[160px] w-full"
          >
            <BarChart
              data={data.efficiency}
              margin={{
                top: 10,
                right: 16,
                left: 12,
                bottom: 4,
              }}
              width="100%"
              height={160}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="conciseness" fill="var(--color-conciseness)" radius={3} />
              <Bar dataKey="redundancy" fill="var(--color-redundancy)" radius={3} />
              <Legend 
                wrapperStyle={{ fontSize: '8px', color: '#9CA3AF' }}
                iconSize={6}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            Grok most concise <Zap className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Efficient communication
          </div>
        </CardFooter>
      </Card>

      {/* Risk Assessment */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
            <Shield className="h-4 w-4 text-red-400" />
            Risk Assessment
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Reliability indicators</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={riskChartConfig}
            className="h-[160px] w-full"
          >
            <RadarChart 
              data={data.risk}
              margin={{
                top: 10,
                right: 10,
                bottom: 10,
                left: 10,
              }}
              width="100%"
              height={160}
            >
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis 
                dataKey="platform" 
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                tickCount={3}
              />
              <Radar 
                name="Hallucination Risk" 
                dataKey="hallucination" 
                stroke="var(--color-hallucination)" 
                fill="var(--color-hallucination)" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
              <Radar 
                name="Contradictions" 
                dataKey="contradictions" 
                stroke="var(--color-contradictions)" 
                fill="var(--color-contradictions)" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
              <Radar 
                name="Confidence/Hedging" 
                dataKey="hedging" 
                stroke="var(--color-hedging)" 
                fill="var(--color-hedging)" 
                fillOpacity={0.1} 
                strokeWidth={2} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '8px', color: '#9CA3AF' }}
                iconSize={6}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            Claude lowest risk <Shield className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Better reliability
          </div>
        </CardFooter>
      </Card>

      {/* Differentiation Analysis */}
      <Card className="bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-1">
            <Target className="h-4 w-4 text-purple-400" />
            Differentiation Analysis
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">Originality metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={differentiationChartConfig}
            className="h-[160px] w-full"
          >
            <LineChart
              data={data.differentiation}
              margin={{
                top: 10,
                right: 16,
                left: 12,
                bottom: 4,
              }}
              width="100%"
              height={160}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 8, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Line 
                type="monotone" 
                dataKey="originality" 
                stroke="var(--color-originality)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-originality)", strokeWidth: 1, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="divergence" 
                stroke="var(--color-divergence)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-divergence)", strokeWidth: 1, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="contribution" 
                stroke="var(--color-contribution)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-contribution)", strokeWidth: 1, r: 3 }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '8px', color: '#9CA3AF' }}
                iconSize={6}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            Gemini most original <Target className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Unique perspectives
          </div>
        </CardFooter>
      </Card>

      {/* Top Keywords Chart - Full Width */}
      <Card className={`bg-gray-900/50 border-gray-800 shadow-xl rounded-lg ${fusionSources ? 'md:col-span-2 xl:col-span-3' : 'md:col-span-2 xl:col-span-3'}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-white">Top Keywords</CardTitle>
          <CardDescription className="text-xs text-gray-500">Most frequently used terms across platforms</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer
            config={keywordChartConfig}
            className="h-[160px] w-full"
          >
            <BarChart 
              data={data.keywords.slice(0, 5)} 
              layout="vertical"
              margin={{
                top: 5,
                right: 16,
                bottom: 5,
                left: 36,
              }}
              width="100%"
              height={160}
            >
              <CartesianGrid horizontal={false} stroke="#374151" />
              <YAxis
                dataKey="word"
                type="category"
                tickLine={false}
                tickMargin={6}
                axisLine={false}
                width={30}
                fontSize={9}
                tick={{ fill: '#9CA3AF' }}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="grok" fill="var(--color-grok)" radius={2} />
              <Bar dataKey="claude" fill="var(--color-claude)" radius={2} />
              <Bar dataKey="gemini" fill="var(--color-gemini)" radius={2} />
              <Legend 
                wrapperStyle={{ fontSize: '8px', color: '#9CA3AF' }}
                iconSize={6}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-xs pt-0 pb-3">
          <div className="flex gap-2 leading-none font-medium text-white text-xs">
            "Quantum" dominates <TrendingUp className="h-3 w-3" />
          </div>
          <div className="text-gray-500 leading-none text-xs">
            Keyword frequency comparison
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}