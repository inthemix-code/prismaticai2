import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles } from 'lucide-react';
import { demoPrompts } from '../data/mockData';
import { DemoPrompt } from '../types';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
  readOnly?: boolean;
  initialValue?: string;
}

export function PromptInput({ onSubmit, loading, readOnly = false, initialValue = '' }: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialValue);

  useEffect(() => {
    setPrompt(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  const handleDemoPrompt = (demoPrompt: DemoPrompt) => {
    setPrompt(demoPrompt.text);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-900/50 border-gray-800 shadow-xl rounded-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="prompt-input" className="small text-gray-300 mb-4">
              {readOnly ? 'Current Query' : 'Enter your prompt to query all AI platforms simultaneously'}
            </label>
            <Textarea
              id="prompt-input"
              placeholder={readOnly ? '' : "Ask anything... Compare how different AI models approach complex questions, creative challenges, or analytical problems."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none text-base bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 rounded-lg"
              disabled={loading || readOnly}
              readOnly={readOnly}
            />
          </div>
          
          {!readOnly && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Button 
                type="submit" 
                disabled={!prompt.trim() || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-base font-semibold rounded-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Querying AIs...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Query All AIs
                  </>
                )}
              </Button>
              
              <p className="muted text-gray-500">
                Results from multiple AI platforms
              </p>
            </div>
          )}
        </form>

        {!readOnly && (
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="small text-gray-300">Try these demo prompts:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoPrompts.map((demo) => (
                <Button
                  key={demo.id}
                  variant="outline"
                  onClick={() => handleDemoPrompt(demo)}
                  disabled={loading}
                  className="h-auto p-4 text-left hover:bg-gray-800 transition-colors bg-gray-800/50 border-gray-700 text-white rounded-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        {demo.category}
                      </Badge>
                    </div>
                    <div className="small text-gray-200 line-clamp-2">
                      <div className="mb-2">{demo.text}</div>
                    </div>
                    <p className="muted text-xs text-gray-500">
                      {demo.description}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}