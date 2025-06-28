import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Eye, EyeOff, Settings } from 'lucide-react';
import { apiService } from '../services/apiService';

export function ApiStatusIndicator() {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const apiStatus = apiService.getApiKeyStatus();
  const isMockMode = apiService.isMockMode();
  
  const toggleMockMode = () => {
    apiService.toggleMockMode();
    window.location.reload(); // Reload to apply changes
  };

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
            <Badge variant={isMockMode ? "secondary" : "default"} className="text-xs">
              {isMockMode ? "Mock Data" : "Real APIs"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMockMode}
              className="h-6 px-2 text-xs"
            >
              Toggle
            </Button>
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
          {isMockMode ? (
            "Currently using mock data. Toggle to use real APIs."
          ) : !apiService.hasValidKeys() ? (
            "Add API keys to your .env file to use real data."
          ) : (
            "Using real API calls. Check console for any errors."
          )}
        </div>
      </CardContent>
    </Card>
  );
}