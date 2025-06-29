"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { BarChart3, TrendingUp, Lightbulb, Hash, ExternalLink, BookOpen, Globe } from "lucide-react"
import type { AIResponse } from "@/lib/mock-data"

interface KnowledgePanelProps {
  responses: AIResponse[]
  query: string
}

export function KnowledgePanel({ responses, query }: KnowledgePanelProps) {
  const avgConfidence = Math.round(responses.reduce((acc, r) => acc + r.confidence, 0) / responses.length)
  const avgResponseTime = Math.round(responses.reduce((acc, r) => acc + r.responseTime, 0) / responses.length)
  const totalWords = responses.reduce((acc, r) => acc + r.wordCount, 0)

  const relatedTopics = [
    "Post-quantum cryptography",
    "Shor's algorithm",
    "Quantum key distribution",
    "RSA encryption",
    "Quantum supremacy",
    "Cryptographic agility",
  ]

  const relatedQueries = [
    "How does quantum computing work?",
    "When will quantum computers break encryption?",
    "What is post-quantum cryptography?",
    "How to prepare for quantum threats?",
    "Quantum vs classical computing security",
  ]

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{responses.length}</div>
              <div className="text-xs text-muted-foreground">AI Responses</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{avgConfidence}%</div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalWords}</div>
              <div className="text-xs text-muted-foreground">Total Words</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Platform Performance
            </h4>
            {responses.map((response) => (
              <div key={response.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {response.platform === "chatgpt" ? "ChatGPT" : response.platform === "claude" ? "Claude" : "Gemini"}
                  </span>
                  <span className="text-muted-foreground">{response.confidence}%</span>
                </div>
                <Progress value={response.confidence} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Related Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5" />
            Related Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {topic}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Current Risk</div>
                <div className="text-muted-foreground">RSA encryption vulnerable within 15-20 years</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Transition Period</div>
                <div className="text-muted-foreground">Post-quantum standards being developed</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Future Security</div>
                <div className="text-muted-foreground">Quantum-safe cryptography solutions available</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            People Also Ask
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {relatedQueries.map((query, index) => (
            <motion.div
              key={query}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
            >
              <div className="text-sm font-medium text-primary hover:underline">{query}</div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Learn More
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "NIST Post-Quantum Cryptography", url: "nist.gov" },
            { title: "Quantum Computing Explained", url: "ibm.com" },
            { title: "Cybersecurity Best Practices", url: "cisa.gov" },
          ].map((resource) => (
            <div key={resource.title} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
              <div>
                <div className="text-sm font-medium text-primary">{resource.title}</div>
                <div className="text-xs text-muted-foreground">{resource.url}</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
