import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TriangleLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  progress?: number; // 0-100
}

export function TriangleLoader({ className, size = 'md', progress = 0 }: TriangleLoaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.1;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [progress]);

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  const svgSizes = {
    sm: { width: 128, height: 128 },
    md: { width: 160, height: 160 },
    lg: { width: 192, height: 192 }
  };

  // Calculate which segments should be filled based on progress
  const getSegmentOpacity = (segmentIndex: number, totalSegments: number) => {
    const segmentProgress = (animatedProgress / 100) * totalSegments;
    if (segmentProgress >= segmentIndex + 1) return 1;
    if (segmentProgress <= segmentIndex) return 0.1;
    return 0.1 + (segmentProgress - segmentIndex) * 0.9;
  };

  // Get progress stage text
  const getProgressText = (progress: number) => {
    if (progress < 25) return 'Initializing...';
    if (progress < 50) return 'Processing query...';
    if (progress < 75) return 'Analyzing responses...';
    if (progress < 95) return 'Generating synthesis...';
    return 'Almost ready...';
  };

  // Define the segments with their paths and colors - using the exact paths from PrismButton
  const segments = [
    // Top segments (Blue gradient)
    { path: "M 62.394 25.417 L 61.786 27 62.394 28.583 L 63.001 30.166 64.251 29.750 L 65.500 29.333 65.500 27 L 65.500 24.667 64.251 24.250 L 63.001 23.834 62.394 25.417", color: "#3B82F6" },
    { path: "M 62.394 35.417 L 61.786 37 62.394 38.583 L 63.001 40.166 64.251 39.750 L 65.500 39.333 65.500 37 L 65.500 34.667 64.251 34.250 L 63.001 33.834 62.394 35.417", color: "#3B82F6" },
    { path: "M 62.180 47.250 L 62.500 49.500 64 49.500 L 65.500 49.500 65.820 47.250 L 66.139 45 64 45 L 61.861 45 62.180 47.250", color: "#3B82F6" },
    
    // Middle segments (Purple gradient)
    { path: "M 62.688 55.646 L 62 56.333 62 58.167 L 62 60 64.070 60 L 66.139 60 65.820 57.828 L 65.500 55.657 64.438 55.307 L 63.375 54.958 62.688 55.646", color: "#8B5CF6" },
    { path: "M 62.394 66.417 L 61.786 68 62.394 69.583 L 63.001 71.166 64.251 70.750 L 65.500 70.333 65.500 68 L 65.500 65.667 64.251 65.250 L 63.001 64.834 62.394 66.417", color: "#8B5CF6" },
    { path: "M 62.394 76.417 L 61.786 78 62.394 79.583 L 63.001 81.166 64.251 80.750 L 65.500 80.333 65.500 78 L 65.500 75.667 64.251 75.250 L 63.001 74.834 62.394 76.417", color: "#8B5CF6" },
    
    // Bottom segments (Cyan gradient)
    { path: "M 56.739 86.449 L 55 87.720 55 88.860 L 55 90 55.918 90 L 56.836 90 58.418 89.393 L 60 88.786 60 87.452 L 60 86.118 59.239 85.648 L 58.478 85.177 56.739 86.449", color: "#06B6D4" },
    { path: "M 68.332 86.578 L 67.709 88.202 69.104 89.086 L 70.500 89.969 71.750 89.985 L 73 90 73 88.741 L 73 87.481 70.977 86.218 L 68.955 84.955 68.332 86.578", color: "#06B6D4" },
    { path: "M 48.200 92.200 L 47 93.400 47 94.700 L 47 96 47.566 96 L 48.131 96 50.066 94.965 L 52 93.930 52 92.465 L 52 91 50.700 91 L 49.400 91 48.200 92.200", color: "#06B6D4" },
    { path: "M 76 92.391 L 76 93.930 78.086 95.046 L 80.171 96.162 80.800 95.533 L 81.429 94.904 80.357 93.202 L 79.286 91.500 77.643 91.177 L 76 90.853 76 92.391", color: "#06B6D4" },
    { path: "M 38.980 98.524 L 37.715 100.048 38.282 100.615 L 38.849 101.183 40.925 100.524 L 43 99.865 43 98.433 L 43 97 41.622 97 L 40.245 97 38.980 98.524", color: "#06B6D4" },
    { path: "M 85 98.433 L 85 99.865 87.075 100.524 L 89.151 101.183 89.718 100.615 L 90.285 100.048 89.020 98.524 L 87.755 97 86.378 97 L 85 97 85 98.433", color: "#06B6D4" },
  ];

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* SVG Loading Animation */}
      <div className={cn('relative', sizeClasses[size])}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width={svgSizes[size].width} 
          height={svgSizes[size].height} 
          viewBox="0 0 128 128" 
          version="1.1"
          className="w-full h-full"
        >
          {/* Base triangle outline */}
          <path 
            d="M 34.474 63.051 L 5.945 120.102 6.532 121.051 L 7.118 122 64 122 L 120.882 122 121.468 121.051 L 122.055 120.102 93.526 63.051 L 64.997 6 64 6 L 63.003 6 34.474 63.051"
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
            fill="none"
          />
          
          {/* Animated segments */}
          {segments.map((segment, index) => (
            <g key={index}>
              <path
                d={segment.path}
                fill={segment.color}
                opacity={getSegmentOpacity(index, segments.length)}
                className="transition-all duration-500 ease-out"
              />
              {/* Add a subtle glow effect for active segments */}
              {getSegmentOpacity(index, segments.length) > 0.5 && (
                <path
                  d={segment.path}
                  fill={segment.color}
                  opacity={0.3}
                  className="animate-pulse"
                  filter="blur(2px)"
                />
              )}
            </g>
          ))}
          
          {/* Glowing effect overlay */}
          <path 
            d="M 34.474 63.051 L 5.945 120.102 6.532 121.051 L 7.118 122 64 122 L 120.882 122 121.468 121.051 L 122.055 120.102 93.526 63.051 L 64.997 6 64 6 L 63.003 6 34.474 63.051"
            stroke="url(#glowGradient)" 
            strokeWidth="2"
            fill="none"
            opacity={Math.min(animatedProgress / 100, 0.8)}
            className="transition-opacity duration-500"
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center progress indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-4">
              {Math.round(animatedProgress)}%
            </div>
            <div className="w-8 h-4 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Text */}
      <div className="text-center">
        <div className="text-sm font-medium text-white">
          {getProgressText(animatedProgress)}
        </div>
      </div>
    </div>
  );
}