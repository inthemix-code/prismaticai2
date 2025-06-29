"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, SortAsc, TrendingUp, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface SearchHeaderProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  resultCount: number
  searchTime: number
}

export function SearchHeader({ query, onQueryChange, onSearch, resultCount, searchTime }: SearchHeaderProps) {
  const [localQuery, setLocalQuery] = useState(query)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(localQuery)
  }

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Ask AI platforms anything..."
              className="pl-10 pr-4 h-12 text-base border-2 focus:border-primary"
            />
          </div>
          <Button type="submit" size="lg" className="px-8">
            Search AI
          </Button>
        </form>

        {/* Search Stats & Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              About {resultCount.toLocaleString()} results ({searchTime}s)
            </span>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Live Analysis
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <span>All Platforms</span>
                </DropdownMenuItem>
                <DropdownMenuItem>ChatGPT Only</DropdownMenuItem>
                <DropdownMenuItem>Claude Only</DropdownMenuItem>
                <DropdownMenuItem>Gemini Only</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>High Confidence (90%+)</DropdownMenuItem>
                <DropdownMenuItem>Recent Responses</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SortAsc className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Relevance</DropdownMenuItem>
                <DropdownMenuItem>Confidence</DropdownMenuItem>
                <DropdownMenuItem>Response Time</DropdownMenuItem>
                <DropdownMenuItem>Word Count</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
