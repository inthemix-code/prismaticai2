import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Beaker,
  Copy,
  Plus,
  Sparkles,
  Trash2,
  Play,
  FlaskConical,
  Clock,
} from 'lucide-react';
import { usePromptLabStore } from '../stores/promptLabStore';
import type { ModelId } from '../types';
import { toast } from 'sonner';

const MODELS: Array<{ id: ModelId; name: string; color: string }> = [
  { id: 'claude', name: 'Claude', color: 'from-orange-500 to-amber-500' },
  { id: 'grok', name: 'Grok', color: 'from-sky-500 to-cyan-500' },
  { id: 'gemini', name: 'Gemini', color: 'from-emerald-500 to-teal-500' },
];

export function PromptLabPage() {
  const navigate = useNavigate();
  const {
    title,
    sharedContext,
    selectedModels,
    variants,
    running,
    recentSessions,
    setTitle,
    setSharedContext,
    toggleModel,
    addVariant,
    removeVariant,
    duplicateVariant,
    updateVariantPrompt,
    updateVariantLabel,
    runLab,
    resetDraft,
    loadRecent,
  } = usePromptLabStore();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    void loadRecent();
  }, [loadRecent]);

  const validCount = variants.filter((v) => v.prompt.trim().length > 0).length;
  const canRun = validCount >= 2 && selectedModels.length >= 1 && !submitting && !running;
  const cellsCount = validCount * selectedModels.length;

  const handleRun = async () => {
    if (!canRun) return;
    setSubmitting(true);
    try {
      const sessionId = await runLab();
      if (sessionId) {
        navigate(`/lab/${sessionId}`);
      } else {
        toast.error('Unable to start lab run');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lab run failed to start');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#070910] text-slate-100"
    >
      <div className="border-b border-slate-800/70 bg-[#0B0F1A]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-semibold tracking-wide text-slate-200">Prompt Lab</span>
          </div>
          <button
            onClick={() => {
              resetDraft();
              toast.success('Draft cleared');
            }}
            className="text-xs text-slate-500 hover:text-slate-200 transition"
          >
            Clear draft
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Beaker className="h-3.5 w-3.5" />
            A/B prompt variation testing
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Compare prompt variants across every model
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-400">
            Author 2 to 4 prompt variants and run them in parallel across Claude, Grok, and Gemini. See the results in a grid and pick the winners.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Session title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Landing page hero tests"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-[#0A0E18] px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Shared context <span className="ml-1 font-normal text-slate-600">(applied to every variant)</span>
              </label>
              <textarea
                value={sharedContext}
                onChange={(e) => setSharedContext(e.target.value)}
                placeholder="Optional system instructions, persona, or constraints reused across all variants."
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-slate-800 bg-[#0A0E18] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Variants</h2>
                  <p className="text-xs text-slate-500">Write 2 to 4 prompt variations to compare</p>
                </div>
                <button
                  onClick={addVariant}
                  disabled={variants.length >= 4}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add variant
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((variant, idx) => (
                  <motion.div
                    key={variant.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-800 bg-[#0A0E18] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <input
                        value={variant.label}
                        onChange={(e) => updateVariantLabel(variant.id, e.target.value)}
                        className="rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-cyan-300 focus:bg-slate-900 focus:outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateVariant(variant.id)}
                          disabled={variants.length >= 4}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeVariant(variant.id)}
                          disabled={variants.length <= 2}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={variant.prompt}
                      onChange={(e) => updateVariantPrompt(variant.id, e.target.value)}
                      placeholder={idx === 0 ? 'Write the base prompt here...' : 'Try a different angle, tone, or structure...'}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-slate-800 bg-[#070910] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                      <span>{variant.prompt.length} chars</span>
                      <span>{variant.prompt.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5">
              <h2 className="text-sm font-semibold text-slate-100">Models</h2>
              <p className="mt-0.5 text-xs text-slate-500">Pick which AI models receive every variant</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODELS.map((model) => {
                  const active = selectedModels.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={`relative overflow-hidden rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200'
                          : 'border-slate-800 bg-[#0A0E18] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${model.color}`} />
                        {model.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="sticky bottom-4 z-20">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRun}
                disabled={!canRun}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition ${
                  canRun
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-cyan-500/30 hover:shadow-cyan-500/50'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                {submitting || running ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                    Running lab...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Run lab
                    <span className="ml-2 rounded-full bg-slate-950/20 px-2.5 py-0.5 text-xs font-medium">
                      {cellsCount} cells
                    </span>
                  </>
                )}
              </motion.button>
              {!canRun && !running && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Fill in at least 2 variants and select at least 1 model
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">Tips</h3>
              </div>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-400">
                <li>Change one dimension per variant (tone, structure, length) to isolate its effect.</li>
                <li>Use shared context for system rules you want applied identically to each variant.</li>
                <li>Duplicate a strong baseline, then tweak the copy to create your next variant.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-[#0B0F1A] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-100">Recent sessions</h3>
              </div>
              {recentSessions.length === 0 ? (
                <p className="text-xs text-slate-500">No runs yet. Your lab history will appear here.</p>
              ) : (
                <ul className="space-y-1.5">
                  {recentSessions.slice(0, 8).map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => navigate(`/lab/${s.id}`)}
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs text-slate-300 transition hover:bg-slate-800/60 hover:text-cyan-300"
                      >
                        {s.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
