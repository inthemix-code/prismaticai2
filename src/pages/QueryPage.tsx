import { useNavigate } from 'react-router-dom';
import { Separator } from "@/components/ui/separator";
import { Sparkles, TrendingUp, BarChart3, Zap } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import { Triangle } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import PrismFeature from '../components/prismfeature';

export function QueryPage() {
  const navigate = useNavigate();
  const { startNewConversation } = useAIStore();

  const handlePromptSubmit = async (prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => {
    await startNewConversation(prompt, selectedModels);
    navigate('/results');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200 p-0 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <Triangle className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 hover:text-white transition-colors duration-200" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans text-white">
                Prismatic
              </h1>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight border-none">
                Orchestrate
                <span className="text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 via-cyan-400 to-teal-300">
                  {" "}Multiple LLMs{" "}
                </span>
                in One Place
              </h2>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 px-4">
                Compare outputs, fuse insights, and gain instant analytics with PrismaticAI.
              </p>
              
              {/* Rainbow separator */}
              <div className="mt-6 sm:mt-8 mb-4">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 pb-12 space-y-6 sm:space-y-12">
        {/* Prompt Input */}
        <div className="max-w-4xl mx-auto">
          <SearchInput onSearch={handlePromptSubmit} isLoading={false} />
        </div>

        {/* Prism Features Section */}
        <div className="max-w-6xl mx-auto px-2 sm:px-0">
          <PrismFeature />
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-2 sm:px-0">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Compare AI Responses Like Never Before
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-4">
              Get comprehensive insights from multiple AI platforms with advanced analytics and intelligent synthesis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-blue-400/30 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Side-by-Side Comparison</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  Compare responses with confidence scoring, response times, and detailed quality metrics across all platforms
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-400/30 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Deep Analytics</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  Advanced sentiment analysis, keyword extraction, risk assessment, and comprehensive performance insights
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-emerald-400/30 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Intelligent Synthesis</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  AI-powered fusion combining the best insights from all models into a comprehensive, unified response
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}