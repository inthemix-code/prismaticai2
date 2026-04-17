import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, ChartBar as BarChart3, Zap, Triangle, Bot, Diamond } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import HowItWorks from '../components/HowItWorks';
import { useAIStore } from '../stores/aiStore';
import boltBadge from '../assets/image copy copy copy.png';

const EXAMPLE_PROMPTS = [
  'What is quantum computing?',
  'Compare React vs Vue in 2025',
  'How does the human immune system work?',
  'Best practices for system design interviews',
  'Explain transformer architecture simply',
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function QueryPage() {
  const navigate = useNavigate();
  const { startNewConversation } = useAIStore();
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduce = useReducedMotion();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (shouldReduce) return;
    const current = EXAMPLE_PROMPTS[promptIndex];
    const speed = isDeleting ? 30 : 55;

    typingRef.current = setTimeout(() => {
      if (!isDeleting && displayText.length < current.length) {
        setDisplayText(current.slice(0, displayText.length + 1));
      } else if (!isDeleting && displayText.length === current.length) {
        typingRef.current = setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText.length > 0) {
        setDisplayText(current.slice(0, displayText.length - 1));
      } else {
        setIsDeleting(false);
        setPromptIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
      }
    }, speed);

    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, [displayText, isDeleting, promptIndex, shouldReduce]);

  const handlePromptSubmit = async (prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => {
    await startNewConversation(prompt, selectedModels);
    navigate('/results');
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Bolt badge */}
      <div className="fixed top-[calc(1rem+5px)] left-4 z-50">
        <img src={boltBadge} alt="Built with Bolt" className="w-10 h-10" />
      </div>

      {/* Background glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-60 -right-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 sm:py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center">
            <Triangle className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">Prismatic</span>
        </div>
        <button
          onClick={scrollToSearch}
          className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 hover:border-cyan-400/50 rounded-full px-4 py-1.5 bg-cyan-500/5 hover:bg-cyan-500/10"
        >
          Try it now
        </button>
      </nav>

      {/* Hero */}
      <header className="relative z-10 pt-10 sm:pt-16 pb-10 sm:pb-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo mark */}
          <motion.div {...fadeUp(0)} className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/8 border border-white/15 rounded-2xl flex items-center justify-center">
                <Triangle className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: '0 0 28px 6px rgba(6,182,212,0.25)' }}
              />
            </div>
            <span className="text-xs font-semibold tracking-widest text-cyan-400/80 uppercase bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
              Beta
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div {...fadeUp(0.1)} className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-white">
              Every AI's best answer.
            </h1>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)' }}
            >
              Unified.
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p {...fadeUp(0.2)} className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed px-2">
            Claude, Grok, and Gemini respond to your question simultaneously.{' '}
            <span className="text-slate-300 font-medium">Prismatic fuses the best of all three.</span>
          </motion.p>

          {/* Stat chips */}
          <motion.div {...fadeUp(0.3)} className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            {['3 AI Models', 'Parallel Queries', '1 Synthesized Answer'].map((stat, i) => (
              <span key={stat} className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  {stat}
                </span>
                {i < 2 && <span className="text-white/20 text-sm select-none hidden sm:inline">·</span>}
              </span>
            ))}
          </motion.div>

          {/* Model trust row */}
          <motion.div {...fadeUp(0.4)} className="flex items-center justify-center gap-3 sm:gap-4">
            <span className="text-xs text-slate-500 font-medium tracking-wide">Powered by</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Bot className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-medium text-slate-300">Claude</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Zap className="w-3 h-3 text-sky-400" />
                <span className="text-xs font-medium text-slate-300">Grok</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Diamond className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-medium text-slate-300">Gemini</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Search input section */}
      <motion.section
        ref={searchRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-4xl mx-auto px-4 pb-16 sm:pb-24"
        id="search"
      >
        {/* Cycling example prompt */}
        <div className="text-center mb-4 h-6">
          {!shouldReduce && (
            <p className="text-xs sm:text-sm text-slate-500">
              <span className="text-slate-400 font-medium">{displayText}</span>
              <span className="inline-block w-0.5 h-3.5 bg-cyan-400 ml-0.5 align-middle animate-pulse" />
            </p>
          )}
        </div>

        {/* Glow halo around search card */}
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-2xl pointer-events-none z-0"
            style={{ boxShadow: '0 0 40px 4px rgba(6,182,212,0.12)' }}
          />
          <SearchInput onSearch={handlePromptSubmit} isLoading={false} />
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="relative z-10 pb-20 sm:pb-28">
        <HowItWorks />
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
            Compare AI Responses Like Never Before
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Get comprehensive insights from multiple AI platforms with advanced analytics and intelligent synthesis
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {[
            {
              icon: TrendingUp,
              title: 'Side-by-Side Comparison',
              description: 'Compare responses with confidence scoring, response times, and detailed quality metrics across all platforms.',
              outcome: 'See which AI answered best at a glance',
              gradient: 'from-blue-500 to-cyan-500',
              hoverGlow: 'rgba(6,182,212,0.18)',
              hoverBorder: 'rgba(6,182,212,0.35)',
            },
            {
              icon: BarChart3,
              title: 'Deep Analytics',
              description: 'Advanced sentiment analysis, keyword extraction, risk assessment, and comprehensive performance insights.',
              outcome: 'Understand quality differences instantly',
              gradient: 'from-sky-500 to-cyan-400',
              hoverGlow: 'rgba(14,165,233,0.18)',
              hoverBorder: 'rgba(14,165,233,0.35)',
            },
            {
              icon: Zap,
              title: 'Intelligent Synthesis',
              description: 'AI-powered fusion combining the best insights from all models into a comprehensive, unified response.',
              outcome: 'One perfect answer, not three good ones',
              gradient: 'from-emerald-500 to-teal-500',
              hoverGlow: 'rgba(20,184,166,0.18)',
              hoverBorder: 'rgba(20,184,166,0.35)',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={staggerItem}
                className="group relative"
              >
                <div
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 h-full transition-all duration-300"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = `0 8px 40px 0 ${card.hoverGlow}`;
                    el.style.borderColor = card.hoverBorder;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = '';
                    el.style.borderColor = '';
                  }}
                >
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-5 sm:mb-6`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    {card.description}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    {card.outcome}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Bottom CTA strip */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-5xl mx-auto px-4 pb-20 sm:pb-28"
      >
        <div
          className="relative rounded-2xl p-8 sm:p-12 text-center overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 60px 0 rgba(6,182,212,0.08)',
          }}
        >
          {/* Animated gradient border shimmer */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, transparent 50%, rgba(20,184,166,0.12) 100%)',
            }}
          />
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to find the best answer?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Ask anything and get a synthesized response from three of the world's leading AI models.
            </p>
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_24px_0_rgba(6,182,212,0.4)]"
            >
              <Triangle className="w-4 h-4" />
              Start Asking
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
