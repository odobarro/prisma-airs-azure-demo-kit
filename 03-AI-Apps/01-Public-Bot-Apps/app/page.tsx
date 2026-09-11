'use client';

import Link from 'next/link';

/**
 * Prisma AIRS Executive Demo Hub Landing Page
 * Centralized navigation entry point replacing automatic redirects.
 * Demonstrates multi-vertical L7 protection (Idira Engine) and 
 * multi-cloud FinOps routing (Portkey Gateway) across Azure, AWS, and GCP LLM endpoints.
 */
export default function CentralHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-black tracking-wider text-indigo-400">PRISMA AIRS</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
              v2026.1 Live Demo
            </span>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Palo Alto Networks • Portkey AI Gateway & Idira Engine Integration
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center items-center w-full">
        
        {/* Architecture Hero Title */}
        <div className="text-center max-w-3xl mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            AI Security & FinOps Demo Environment
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Select a vertical portal below to test inline L7 threat prevention (Jailbreaks, Prompt Injections, DLP) and multi-cloud token caching across Azure OpenAI, AWS Bedrock, and GCP Vertex AI.
          </p>
        </div>

        {/* Vertical Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* RETAIL PORTAL CARD */}
          <Link 
            href="/retail"
            className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-3xl">🛒</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full">
                  E-Commerce Vertical
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                NovaRetail Store
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Test fraud vectors targeting retail chatbots: unauthorized discount generation, system prompt overrides, and basic shipping policy semantic caching.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🚨 Fake Discounts</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🚨 Data Exfiltration</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded">✅ Semantic Cache</span>
              </div>
              <div className="text-xs font-semibold text-indigo-400 flex items-center justify-between pt-2">
                <span>Launch Retail Demo</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* FINANCE PORTAL CARD */}
          <Link 
            href="/finance"
            className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-3xl">🏦</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800 px-3 py-1 rounded-full">
                  Financial Services
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                NovaFinance Bank
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Evaluate high-risk FSI scenarios: unauthorized loan approvals via DAN Jailbreaks, PCI-DSS credit card exfiltration (DLP), and interest rate caching.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🚨 VIP Loan Jailbreak</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">🚨 PCI-DSS DLP Leak</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded">✅ Compliance Check</span>
              </div>
              <div className="text-xs font-semibold text-blue-400 flex items-center justify-between pt-2">
                <span>Launch Finance Demo</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

        </div>

        {/* Architectural Overview Strip */}
        <div className="mt-16 w-full max-w-4xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div>
            <span className="text-indigo-400 font-bold block mb-1">Control Plane (AI-SPEM)</span>
            <span className="text-slate-400">Passive ARM/IAM scanning for Azure OpenAI discovery ($0.00 cost).</span>
          </div>
          <div>
            <span className="text-emerald-400 font-bold block mb-1">Data Plane (Idira Engine)</span>
            <span className="text-slate-400">Inline L7 firewall preventing Jailbreaks and DLP leaks (~15-30ms latency).</span>
          </div>
          <div>
            <span className="text-amber-400 font-bold block mb-1">FinOps (Portkey Gateway)</span>
            <span className="text-slate-400">Semantic caching and multi-cloud fallback routing across LLM providers.</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        Prisma AIRS Multi-Vertical Architecture • Palo Alto Networks 2026
      </footer>
    </div>
  );
}