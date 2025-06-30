import boltBadge from '../assets/image copy copy copy.png';
import { Triangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";

const PrismFeatures = () => {
  const features = [
    {
      emoji: "🔍",
      title: "Multi-AI Truth Finder",
      subtitle: "Cut through hallucinations and contradictions.",
      description: "Verifies answers across models to reveal consensus, detect blind spots, and surface the strongest insights — all in one click."
    },
    {
      emoji: "🧠",
      title: "Instant Expert Mode",
      subtitle: "Think like a strategist, not a prompt engineer.",
      description: "Instead of chasing answers across tabs, get structured intelligence — ranked, scored, and synthesized for decision-ready thinking."
    },
    {
      emoji: "⚡",
      title: "Fast. Fused. Frictionless.",
      subtitle: "One prompt. Infinite edge.",
      description: "Get the best response in seconds, with visualized comparisons and deep analytics only if you need them."
    }
  ];

  return (
    <div className="text-center py-8 sm:py-12">
      {/* Fixed Bolt badge in top left corner */}
      <div className="fixed top-4 left-4 z-50">
        <img src={boltBadge} alt="Built with Bolt" className="w-9 h-9" />
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 font-inter px-4">
          Ask anything, get the best answer
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-md mx-auto text-balance mb-4 px-4">
          One input. Multiple outputs.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium leading-relaxed max-w-lg mx-auto text-balance mb-8 sm:mb-16 px-4">
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium leading-relaxed max-w-lg mx-auto text-balance mb-6 sm:mb-8 px-4">
          Our AI synthesis engine analyzes responses from multiple models to give you the most comprehensive answer
        </p>
      </div>

      {/* Mobile Layout - Simple Stacked Design */}
      <div className="block lg:hidden space-y-4">
        {/* Input Card */}
        <div className="absolute right-20 bottom-[-5px] w-96 z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="space-y-3">
              <div>
                <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                  Input
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-200 mb-1">
                  Your prompt
                </div>
                <p className="text-xs text-gray-500">
                  Single query processed by multiple AI models
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prism Visual Indicator */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Triangle className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 px-4">
          {features.map((feature, index) => (
            <div key={index} className="w-full">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="space-y-3">
                  <div>
                    <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                      {index === 0 ? 'Verification' : index === 1 ? 'Intelligence' : 'Performance'}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{feature.emoji}</span>
                      <div className="text-sm font-medium text-gray-200">{feature.title}</div>
                    </div>
                    <div className="text-xs text-gray-300 font-medium mb-2">{feature.subtitle}</div>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Prism Visualization */}
      <div className="relative w-full max-w-7xl mx-auto hidden lg:block">
        <div className="relative h-[600px] flex items-center justify-center">
          {/* SVG Container */}
          <svg viewBox="0 0 1200 600" className="w-full h-full absolute z-0">
            <defs>
              <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Input line from left */}
            <line 
              x1="212" y1="300" 
              x2="330" y2="300" 
              stroke="#6B7280" 
              strokeWidth="1"
            />
            
            {/* Prism Triangle - using our Triangle icon shape */}
            <g transform="translate(400, 300)">
              <polygon 
                points="0,-90 80,45 -80,45" 
                fill="url(#prismGradient)"
                stroke="#60A5FA" 
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="drop-shadow-sm"
              />
              {/* Inner light refraction lines */}
              <line x1="-79.67" y1="0" x2="26" y2="-61" stroke="#EF4444" strokeWidth="1" opacity="0.6" />
              <line x1="-79.67" y1="0" x2="53" y2="-31" stroke="#FBBF24" strokeWidth="1" opacity="0.4" />
              <line x1="-79.67" y1="0" x2="79.67" y2="0" stroke="#10B981" strokeWidth="1" opacity="0.6" />
            </g>
            
            {/* Three output beams to feature cards */}
            <line 
              x1="420" y1="239" 
              x2="796" y2="79" 
              stroke="#EF4444" 
              strokeWidth="1"
            />
            <line 
              x1="453" y1="269" 
              x2="796" y2="300" 
              stroke="#FBBF24" 
              strokeWidth="1"
            />
            <line 
              x1="479.67" y1="300" 
              x2="796" y2="521" 
              stroke="#10B981" 
              strokeWidth="1"
            />
          </svg>

          {/* Input Card */}
          <div className="absolute left-20 top-1/2 transform -translate-y-1/2 w-48 z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Input
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-200 mb-1">
                    Your prompt
                  </div>
                  <p className="text-xs text-gray-500">
                    Single query processed by multiple AI models
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards positioned at beam endpoints */}
          <div className="absolute right-20 top-[-5px] w-96 z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Verification
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{features[0].emoji}</span>
                    <div className="text-sm font-medium text-gray-200">{features[0].title}</div>
                  </div>
                  <div className="text-xs text-gray-300 font-medium mb-2">{features[0].subtitle}</div>
                  <p className="text-xs text-gray-500">{features[0].description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-20 top-1/2 transform -translate-y-1/2 w-96 z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Intelligence
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{features[1].emoji}</span>
                    <div className="text-sm font-medium text-gray-200">{features[1].title}</div>
                  </div>
                  <div className="text-xs text-gray-300 font-medium mb-2">{features[1].subtitle}</div>
                  <p className="text-xs text-gray-500">{features[1].description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-20 bottom-[-5px] w-96 z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    Performance
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{features[2].emoji}</span>
                    <div className="text-sm font-medium text-gray-200">{features[2].title}</div>
                  </div>
                  <div className="text-xs text-gray-300 font-medium mb-2">{features[2].subtitle}</div>
                  <p className="text-xs text-gray-500">{features[2].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuation separator with three colored lines representing the prism output */}
      <div className="mt-6 sm:mt-8 mb-3 sm:mb-4">
        <div className="flex items-center justify-center">
          <div className="flex-1 max-w-sm">
            <Separator className="bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />
          </div>
          <div className="flex-1 max-w-sm">
            <Separator className="bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          </div>
          <div className="flex-1 max-w-sm">
            <Separator className="bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrismFeatures;