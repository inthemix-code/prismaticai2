import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CircleHelp as HelpCircle } from 'lucide-react';
import { fetchFaqs, type Faq } from '../services/homepageContent';

export function FaqSection() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchFaqs().then((data) => {
      if (active) {
        setItems(data);
        setLoading(false);
        if (data[0]) setOpenId(data[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative z-10 max-w-3xl mx-auto px-4 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-cyan-400/80 uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          Questions
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Everything you need to know
        </h2>
      </motion.div>

      <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm">
        {loading && (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-3 bg-white/5 rounded w-1/2" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        )}
        {items.map((f) => {
          const open = openId === f.id;
          return (
            <div key={f.id}>
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm sm:text-base font-medium text-white pr-4">
                  {f.question}
                </span>
                <Plus
                  className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-300 ${
                    open ? 'rotate-45' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 sm:px-6 pb-5 text-sm text-slate-400 leading-relaxed">
                      {f.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
