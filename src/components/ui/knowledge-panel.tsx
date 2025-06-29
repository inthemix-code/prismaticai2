import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info } from 'lucide-react';

interface KnowledgePanelProps {
  title: string;
  description: string;
  facts?: string[];
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
}

export function KnowledgePanel({ title, description, facts = [], sources = [] }: KnowledgePanelProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        {facts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Facts</h4>
            <ul className="space-y-1">
              {facts.map((fact, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <span className="mr-2">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {sources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sources</h4>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{source.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {source.domain}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    asChild
                  >
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}