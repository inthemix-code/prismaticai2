"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ExternalLink, Copy, ThumbsUp, ThumbsDown, TrendingUp, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIResponse } from "@/lib/mock-data"

const platformConfig = {
  chatgpt: {
    name: "ChatGPT",
    url: "chatgpt.com",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200",
    icon: "🤖",
  },
  claude: {
    name: "Claude",
    url: "claude.ai",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200",
    icon: "🧠",
  },
  gemini: {
    name: "Gemini",
    url: "gemini.google.com",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200",
    icon: "✨",
  },
}

interface AIResultCardProps {
  response: AIResponse
  query: string
  index: number
}

export function AIResultCard({ response, query, index }: AIResultCardProps) {
  const config = platformConfig[response.platform]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
        <CardContent className="p-6 space-y-4">
          {/* Header with platform info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-lg", config.bgColor)}>
                {config.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-semibold text-lg", config.color)}>{config.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    AI Response
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{config.url}</span>
                  <span>•</span>
                  <span>{response.responseTime}ms</span>
                  <span>•</span>
                  <span>{response.wordCount} words</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {response.confidence}%
              </Badge>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Response Content */}
          <div className="space-y-3">
            <p className="text-base leading-relaxed text-foreground/90 line-clamp-4">{response.response}</p>

            {/* Quick insights */}
            <div className="flex flex-wrap gap-2">
              {response.platform === "chatgpt" && (
                <>
                  <Badge variant="outline" className="text-xs">
                    Encryption Risks
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Shor's Algorithm
                  </Badge>
                </>
              )}
              {response.platform === "claude" && (
                <>
                  <Badge variant="outline" className="text-xs">
                    Post-Quantum Crypto
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Security Solutions
                  </Badge>
                </>
              )}
              {response.platform === "gemini" && (
                <>
                  <Badge variant="outline" className="text-xs">
                    Quantum Interference
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Future Computing
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Response Confidence</span>
              <span className={config.color}>{response.confidence}%</span>
            </div>
            <Progress value={response.confidence} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Full
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
