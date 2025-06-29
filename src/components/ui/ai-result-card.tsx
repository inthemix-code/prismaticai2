import React from 'react';
import type { AIResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Clock, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIResultCardProps {
  response: AIResponse;
  className?: string;
}

export function AIResultCard({ response, className }: AIResultCardProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(response.content);
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(1)}s`;
  };

  if (response.loading) {
    return (
      <Card className={`h-[400px] flex flex-col bg-gray-900/50 border-gray-800 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-white capitalize">
              {response.platform}
            </CardTitle>
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-6 h-6 mb-2 animate-spin" />
            <p className="text-xs text-gray-400 text-center">
              Generating response...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (response.error) {
    return (
      <Card className={`h-[400px] flex flex-col bg-gray-900/50 border-red-800 ${className}`}>
        <CardHeader className="pb-3 bg-red-950/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-white capitalize">
              {response.platform}
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6 mb-2" />
            <p className="text-xs text-center px-2">{response.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-[400px] flex flex-col bg-gray-900/50 border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-white capitalize">
              {response.platform}
            </CardTitle>
            <CheckCircle className="w-3 h-3 text-green-400" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 hover:bg-gray-800"
          >
            <Copy className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Confidence</span>
            <span className="text-xs font-semibold text-blue-400">
              {Math.round(response.confidence * 100)}%
            </span>
          </div>
          
          <div className="flex gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatResponseTime(response.responseTime)}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {response.wordCount} words
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-4">
        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
          <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
            {response.content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}