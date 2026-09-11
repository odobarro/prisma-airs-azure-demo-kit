'use client';

import Link from 'next/link';

/**
 * Prisma AIRS Executive Demo Hub Landing Page
 * Centralized navigation entry point showcasing multi-vertical L7 protection.
 */
export default function CentralHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-black tracking-wider text-indigo-400">PRISMA AIRS</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
              v2026.1 Live Demo
            </span>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Palo Alto Networks • AI Gateway & Runtime Protection
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center items-center w-full">
        <div className="text-center max-w-3xl mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            AI Security & FinOps Environments
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Select a vertical portal below to test inline L7 threat prevention (Jailbreaks, Prompt Injections, DLP) and multi-cloud token caching across Azure OpenAI instances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* RETAIL PORTAL */}
          <Link 
            href="/retail"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between h-full"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-3xl">🛒</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2.5 py-1 rounded-full">
                  E-Commerce
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                NovaRetail Store
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Test fraud vectors targeting retail chatbots: unauthorized discounts and system overrides.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col space-y-2">
              <div className="text-xs font-semibold text-indigo-400 flex items-center justify-between">
                <span>Launch Retail Demo</span>
                <span className="transform group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>
          </Link>

          {/* FINANCE PORTAL */}
          <Link 
            href="/finance"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between h-full"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-3xl">🏦</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800 px-2.5 py-1 rounded-full">
                  Financial Services
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                NovaFinance Bank
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Evaluate high-risk FSI scenarios: unauthorized loan approvals and PCI-DSS credit card exfiltration.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col space-y-2">
              <div className="text-xs font-semibold text-blue-400 flex items-center justify-between">
                <span>Launch Finance Demo</span>
                <span className="transform group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>
          </Link>

          {/* INDUSTRY PORTAL */}
          <Link 
            href="/industry"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between h-full"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-3xl">🏭</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                  Manufacturing / IoT
                </span>
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                NovaIndustry Corp
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Test OT/IoT security: Intellectual Property (IP) blueprints theft and unauthorized machinery overrides.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                <span>Launch Industry Demo</span>
                <span className="transform group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}