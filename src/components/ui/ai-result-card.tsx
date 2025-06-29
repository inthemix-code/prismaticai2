import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIResultCardProps {
  title: string;
  content: string;
  platform: string;
}

export function AIResultCard({ title, content, platform }: AIResultCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">{platform}</div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content}</p>
      </CardContent>
    </Card>
  );
}