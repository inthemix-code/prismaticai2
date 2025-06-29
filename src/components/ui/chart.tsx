import * as React from "react"
import { createContext, useContext } from "react"

export type ChartConfig = {
  [key: string]: {
    label?: string;
    color: string; // Ensure color is typed as string
  };
}

// Chart context for sharing config
const ChartContext = createContext<{ config: ChartConfig } | null>(null)

export function useChart() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

// Chart container component
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

export function ChartContainer({ config, children, ...props }: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

// Chart tooltip components
export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function ChartTooltipContent({ indicator, ...props }: { indicator?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}