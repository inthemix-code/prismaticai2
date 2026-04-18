import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { fetchTestimonials, type Testimonial } from '../services/homepageContent';

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchTestimonials().then((data) => {
      if (active) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-12"
      >
        <span className="text-xs font-semibold tracking-widest text-cyan-400/80 uppercase">
          Loved by builders
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Teams ship better answers with Prismatic
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(loading ? Array.from({ length: 3 }) : items).map((raw, idx) => {
          const t = raw as Testimonial | undefined;
          return (
            <motion.div
              key={t?.id ?? idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-7 h-full flex flex-col"
            >
              <Quote className="w-7 h-7 text-cyan-400/60 mb-4" />
              {t ? (
                <>
                  <p className="text-sm text-slate-200 leading-relaxed flex-1">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center gap-1 mt-5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <img
                      src={t.author_avatar_url}
                      alt={t.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{t.author_name}</p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5">{t.author_title}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
