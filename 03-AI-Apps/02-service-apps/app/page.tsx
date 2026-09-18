'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Cpu, Terminal, Shield } from 'lucide-react';

const i18n = {
  es: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model & Skill Validation Hub',
    subtitle: 'Análisis estático pre-despliegue para cumplimiento de licencias, vulnerabilidades (CVEs) y detección de código malicioso.',
    modelUrlLabel: 'URL del Artefacto (Hugging Face / GitLab)',
    groupLabel: 'Strata Cloud Manager Policy Group ID (UUID)',
    scanBtn: 'Auditar Artefacto',
    scanning: 'Evaluando políticas en Azure Container Apps...',
    resultsTitle: 'Veredicto de Seguridad SCM',
    statusPassed: 'APROBADO PARA DESPLIEGUE',
    statusFailed: 'RIESGO DETECTADO - BLOQUEADO',
    rawResponse: 'Telemetría de Inspección (Raw Payload)',
  },
  en: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model & Skill Validation Hub',
    subtitle: 'Pre-deployment static analysis for license compliance, vulnerabilities (CVEs), and malicious code detection.',
    modelUrlLabel: 'Artifact URL (Hugging Face / GitLab)',
    groupLabel: 'Strata Cloud Manager Policy Group ID (UUID)',
    scanBtn: 'Audit Artifact',
    scanning: 'Evaluating policies via Azure Container Apps...',
    resultsTitle: 'SCM Security Verdict',
    statusPassed: 'APPROVED FOR DEPLOYMENT',
    statusFailed: 'RISK DETECTED - BLOCKED',
    rawResponse: 'Inspection Telemetry (Raw Payload)',
  },
};

export default function SecurityHubPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [modelUrl, setModelUrl] = useState('https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf');
  const [groupId, setGroupId] = useState('2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const t = i18n[lang];

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_url: modelUrl, group_id: groupId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo en la comunicación con el plano de datos.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 font-mono selection:bg-cyan-900 selection:text-cyan-100">
      <header className="border-b border-slate-800/60 bg-[#0a0f18]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-slate-700/50 rounded-lg shadow-inner">
            <Shield className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="font-semibold tracking-wide text-sm text-slate-300">Palo Alto Networks <span className="text-cyan-600 ml-1">| SecOps</span></span>
        </div>

        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 text-xs bg-slate-900/50 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700/50 transition duration-200 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-500" />
          <span className="font-medium">{lang.toUpperCase()}</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <span className="inline-block text-[10px] tracking-[0.2em] font-bold uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 px-3 py-1.5 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            {t.badge}
          </span>
          <h1 className="text-4xl font-extrabold text-white flex items-center justify-center gap-3 tracking-tight">
            <Cpu className="text-cyan-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> {t.title}
          </h1>
          <p className="text-sm text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-7 shadow-2xl shadow-black/50 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 opacity-80"></div>
          
          <form onSubmit={handleScan} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2">{t.modelUrlLabel}</label>
              <input
                type="text"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 font-mono transition-all shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2">{t.groupLabel}</label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-mono transition-all shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.23)] hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                   {t.scanning}
                </span>
              ) : (
                <>
                  <Terminal className="w-4 h-4" /> {t.scanBtn}
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-5 rounded-2xl text-sm mb-8 flex items-start gap-3 shadow-lg">
             <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
             <div>
                <strong className="block text-rose-400 mb-1">Error de Ejecución:</strong>
                {error}
             </div>
          </div>
        )}

        {result && (
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-7 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">{t.resultsTitle}</h2>
              {result.status === 'PASSED' || result.verdict === 'ALLOW' ? (
                <span className="text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {t.statusPassed}
                </span>
              ) : (
                <span className="text-xs font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> {t.statusFailed}
                </span>
              )}
            </div>

            <div className="bg-[#0a0f18] p-5 rounded-xl border border-slate-800/50 text-[11px] leading-relaxed overflow-x-auto shadow-inner">
              <span className="text-slate-500 block mb-3 font-semibold tracking-wider">/* {t.rawResponse} */</span>
              <pre className="text-cyan-400/90 font-mono">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}