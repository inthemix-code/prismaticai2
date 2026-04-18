import { Triangle, Github, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center">
                <Triangle className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-white font-semibold text-base tracking-tight">Prismatic</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The unified AI answer layer. Claude, Grok, and Gemini—synthesized into one trustworthy response.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              {['How it works', 'Models', 'Analytics', 'Roadmap'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              {['About', 'Privacy', 'Terms', 'Contact'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© {year} Prismatic. All rights reserved.</p>
          <p className="text-xs text-slate-500">Crafted with care · Beta release</p>
        </div>
      </div>
    </footer>
  );
}
