import { motion } from 'framer-motion';
import { PenLine, Layers, Merge } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: PenLine,
    title: 'Type your question',
    description: 'Enter any question or topic. No special syntax needed — just ask naturally.',
    color: 'from-cyan-500 to-teal-500',
    glow: 'rgba(6,182,212,0.15)',
  },
  {
    number: '02',
    icon: Layers,
    title: '3 AIs respond in parallel',
    description: 'Claude, Grok, and Gemini all receive your query simultaneously and respond at once.',
    color: 'from-sky-500 to-cyan-500',
    glow: 'rgba(14,165,233,0.15)',
  },
  {
    number: '03',
    icon: Merge,
    title: 'Synthesized, cited, judged',
    description: 'One unified answer with sentence-level citations, a confidence score, and a judge verdict naming the strongest model for your question.',
    color: 'from-teal-500 to-emerald-500',
    glow: 'rgba(20,184,166,0.15)',
  },
];

const auxCapabilities = [
  'Fork any turn',
  'Pin facts to project memory',
  'Share read-only links',
  'Export as Markdown',
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const HowItWorks = () => {
  return (
    <section className="max-w-5xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-12"
      >
        <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-3">
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
          One prompt. Three minds. One trusted answer.
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Prismatic queries Claude, Grok, and Gemini in parallel — then fuses them into a cited, judged synthesis.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 relative"
      >
        {/* Connecting dashed line — desktop only */}
        <div className="hidden md:block absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px border-t border-dashed border-white/15 pointer-events-none z-0" />

        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              variants={stepVariants}
              className="relative z-10 group"
            >
              <div
                className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 h-full transition-all duration-300 hover:border-white/20"
                style={{
                  boxShadow: `0 0 0 0 ${step.glow}`,
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px 0 ${step.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${step.glow}`;
                }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white/10 leading-none mt-1 select-none">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
      >
        {auxCapabilities.map((cap, i) => (
          <span key={cap} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">{cap}</span>
            {i < auxCapabilities.length - 1 && (
              <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />
            )}
          </span>
        ))}
      </motion.div>
    </section>
  );
};

export default HowItWorks;
