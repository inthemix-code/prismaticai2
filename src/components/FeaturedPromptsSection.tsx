import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { fetchFeaturedPrompts, type FeaturedPrompt } from '../services/homepageContent';

interface FeaturedPromptsSectionProps {
  onSelect: (prompt: string) => void;
}

export function FeaturedPromptsSection({ onSelect }: FeaturedPromptsSectionProps) {
  const [prompts, setPrompts] = useState<FeaturedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFeaturedPrompts().then((data) => {
      if (active) {
        setPrompts(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loading && prompts.length === 0) return null;

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-cyan-400/80 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Try a curated prompt
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Start with a question the community loves
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {(loading ? Array.from({ length: 6 }) : prompts).map((raw, idx) => {
          const p = raw as FeaturedPrompt | undefined;
          return (
            <motion.button
              key={p?.id ?? idx}
              onClick={() => p && onSelect(p.prompt)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              disabled={!p}
              className="group relative text-left bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:border-cyan-400/40 rounded-xl px-5 py-4 transition-all duration-200 flex items-start justify-between gap-4 disabled:opacity-60 disabled:cursor-default"
            >
              {p ? (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-semibold tracking-wider text-cyan-400/80 uppercase mb-1.5">
                      {p.category}
                    </span>
                    <p className="text-sm text-slate-200 group-hover:text-white leading-snug">
                      {p.prompt}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                </>
              ) : (
                <div className="space-y-2 animate-pulse w-full">
                  <div className="h-2 bg-white/5 rounded w-16" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
