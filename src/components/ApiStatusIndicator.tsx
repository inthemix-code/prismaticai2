import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EyeOff, Settings, Wifi } from 'lucide-react';

export function ApiStatusIndicator() {
  const [isVisible, setIsVisible] = React.useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const hasSupabase = !!(supabaseUrl && !supabaseUrl.includes('your-project'));

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800/80 hover:bg-gray-700 text-white"
        aria-label="Show API status"
      >
        <Settings className="w-4 h-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-72 bg-gray-900/95 border-gray-700 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" aria-hidden="true" />
            API Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            aria-label="Hide API status"
          >
            <EyeOff className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Edge Function Proxy</span>
          <Badge
            variant={hasSupabase ? 'default' : 'secondary'}
            className={`text-xs ${hasSupabase ? 'bg-green-900/50 text-green-400 border-green-700' : 'bg-yellow-900/50 text-yellow-400 border-yellow-700'}`}
          >
            {hasSupabase ? 'Configured' : 'Not set'}
          </Badge>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
          {hasSupabase
            ? 'AI calls are routed through secure Edge Functions. API keys are not exposed to the browser.'
            : 'Set VITE_SUPABASE_URL in your .env to enable the secure proxy.'}
        </div>
      </CardContent>
    </Card>
  );
}
