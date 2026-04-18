import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, Loader as Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/homepageContent';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError('');
    const result = await subscribeToNewsletter(email);
    if (result.ok) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setError(result.error ?? 'Something went wrong.');
    }
  };

  return (
    <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 sm:p-12"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(6,182,212,0.12) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(20,184,166,0.1) 0%, transparent 55%)',
          }}
        />

        <div className="relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-cyan-400/80 uppercase">
            <Mail className="w-3.5 h-3.5" />
            Stay in the loop
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Get product updates and new model launches
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            One email per month. New models, features, and research—no filler.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-70 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_22px_0_rgba(6,182,212,0.35)]"
            >
              {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'success' && <Check className="w-4 h-4" />}
              {status === 'success' ? 'Subscribed' : 'Subscribe'}
            </button>
          </form>
          {status === 'error' && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
          {status === 'success' && (
            <p className="text-xs text-emerald-400">Thanks for joining. Look out for our next update.</p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
