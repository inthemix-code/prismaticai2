import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Eye, EyeOff, Settings } from 'lucide-react';
import { aiService } from '../services/aiService';

export function ApiStatusIndicator() {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const apiStatus = aiService.getApiKeyStatus();
  const hasValidKeys = aiService.hasValidKeys();
  

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800/80 hover:bg-gray-700 text-white"
      >
        <Settings className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-gray-900/95 border-gray-700 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white">API Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Data Source:</span>
          <div className="flex items-center gap-2">
            <Badge variant={hasValidKeys ? "default" : "secondary"} className="text-xs">
              {hasValidKeys ? "Real APIs" : "No API Keys"}
            </Badge>
          </div>
        </div>

        {/* API Key Status */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300">API Keys:</div>
          {Object.entries(apiStatus).map(([api, hasKey]) => (
            <div key={api} className="flex items-center justify-between">
              <span className="text-xs text-gray-400 capitalize">{api}:</span>
              <div className="flex items-center gap-1">
                {hasKey ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400" />
                )}
                <span className="text-xs text-gray-500">
                  {hasKey ? "Set" : "Missing"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
          {!hasValidKeys ? (
            "Add API keys to your .env file to use real data."
          ) : (
            "Ready to use real API calls."
          )}
        </div>
      </CardContent>
    </Card>
  );
}