'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Cpu, Terminal, Shield, AlertTriangle, Database, Cloud, Key, FileInput } from 'lucide-react';

const SOURCES_CATALOG = {
  HuggingFace: {
    groups: [
      { name: 'HuggingFace_Scan', uuid: 'a6be1f6f-4d8e-4f78-9ebf-7339d1646bb0' },
      { name: 'Default HUGGING_FACE', uuid: '2baf2bc5-2ae2-42d6-a548-9af6a2cb4c32' }
    ],
    presetUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf'
  },
  GitLab: {
    groups: [
      { name: 'GitLab_Scan', uuid: '17fdc41a-aae5-434d-a648-cd118679cc0e' }
    ],
    presetUrl: 'https://gitlab.com/netsec-sc/airs-test/-/ml/models/3007547/versions/3019068',
    presetToken: 'glpat-XdfdIINaiQMLWLtbXMzD92M6MQpvOjEKdTpubjU1OA8.01.171hs2q0c'
  },
  Azure: {
    groups: [
      { name: 'Default AZURE', uuid: '3113a7e0-73ff-4641-8451-65f105ec4291' }
    ],
    presetUrl: ''
  }
};

type ModelSource = keyof typeof SOURCES_CATALOG;

const i18n = {
  es: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Análisis estático en tiempo real contra políticas de Strata Cloud Manager.',
    sourceLabel: 'Origen del Modelo (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'URL del Artefacto o Repositorio',
    tokenLabel: 'GitLab Personal Access Token (PAT)',
    loadPreset: 'Cargar Modelo de Ejemplo',
    scanBtn: 'Auditar Artefacto',
    scanning: 'Ejecutando motor Idira en Azure...',
    resultsTitle: 'Veredicto SCM',
    statusPassed: 'APROBADO PARA DESPLIEGUE',
    statusFailed: 'RIESGO DETECTADO - BLOQUEADO',
  },
  en: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Real-time static analysis against Strata Cloud Manager policies.',
    sourceLabel: 'Model Origin (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'Artifact or Repository URL',
    tokenLabel: 'GitLab Personal Access Token (PAT)',
    loadPreset: 'Load Preset Example',
    scanBtn: 'Audit Artifact',
    scanning: 'Running Idira engine in Azure...',
    resultsTitle: 'SCM Verdict',
    statusPassed: 'APPROVED FOR DEPLOYMENT',
    statusFailed: 'RISK DETECTED - BLOCKED',
  },
};

export default function SecurityHubPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  
  const [source, setSource] = useState<ModelSource>('HuggingFace');
  const [groupId, setGroupId] = useState(SOURCES_CATALOG['HuggingFace'].groups[0].uuid);
  const [modelUrl, setModelUrl] = useState('');
  const [gitlabToken, setGitlabToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const t = i18n[lang];

  useEffect(() => {
    // Reset inputs when source changes
    setGroupId(SOURCES_CATALOG[source].groups[0].uuid);
    setModelUrl('');
    setGitlabToken('');
  }, [source]);

  const handleLoadPreset = () => {
    setModelUrl(SOURCES_CATALOG[source].presetUrl);
    if (source === 'GitLab' && SOURCES_CATALOG['GitLab'].presetToken) {
      setGitlabToken(SOURCES_CATALOG['GitLab'].presetToken);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload: any = { model_url: modelUrl, group_id: groupId };
      if (source === 'GitLab' && gitlabToken) {
        payload.gitlab_token = gitlabToken;
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo en la comunicación con la API proxy.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = result?.eval_outcome === 'BLOCKED' || (result?.violations && result?.violations.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 font-mono selection:bg-cyan-900 pb-20">
      <header className="border-b border-slate-800/60 bg-[#0a0f18]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-slate-700/50 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="font-semibold text-sm text-slate-300">Palo Alto Networks <span className="text-cyan-600 ml-1">| SecOps</span></span>
        </div>
        <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="flex items-center gap-2 text-xs bg-slate-900/50 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/50">
          <Globe className="w-3.5 h-3.5 text-cyan-500" /> {lang.toUpperCase()}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <span className="inline-block text-[10px] tracking-[0.2em] font-bold uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 px-3 py-1.5 rounded-full mb-4">
            {t.badge}
          </span>
          <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-3 tracking-tight">
            <Cpu className="text-cyan-500 w-7 h-7" /> {t.title}
          </h1>
          <p className="text-sm text-slate-400 mt-4">{t.subtitle}</p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-7 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-80"></div>
          
          <form onSubmit={handleScan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <Cloud className="w-3.5 h-3.5 text-cyan-600" /> {t.sourceLabel}
                 </label>
                 <select value={source} onChange={(e) => setSource(e.target.value as ModelSource)} disabled={loading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-cyan-300 focus:border-cyan-500 outline-none">
                   {(Object.keys(SOURCES_CATALOG) as ModelSource[]).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> {t.groupLabel}
                 </label>
                 <select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={loading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none">
                   {SOURCES_CATALOG[source].groups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
                 </select>
               </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                 <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" /> {t.modelUrlLabel}
                 </label>
                 {SOURCES_CATALOG[source].presetUrl && (
                   <button type="button" onClick={handleLoadPreset} className="text-[10px] flex items-center gap-1 bg-cyan-950/50 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/50 px-2 py-1 rounded transition-colors">
                      <FileInput className="w-3 h-3" /> {t.loadPreset}
                   </button>
                 )}
              </div>
              <input type="text" value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} disabled={loading} required className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-cyan-500 outline-none" />
            </div>

            {source === 'GitLab' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <Key className="w-3.5 h-3.5 text-amber-500" /> {t.tokenLabel}
                </label>
                <input type="password" value={gitlabToken} onChange={(e) => setGitlabToken(e.target.value)} disabled={loading} required className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-amber-300/80 focus:border-amber-500 outline-none" placeholder="glpat-..." />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 disabled:from-slate-800 text-white font-bold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mt-4">
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Terminal className="w-4 h-4" />}
              {loading ? t.scanning : t.scanBtn}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-5 rounded-xl text-sm mb-8 flex items-center gap-3">
             <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
              <h2 className="text-lg font-bold text-white">{t.resultsTitle}</h2>
              {isBlocked ? (
                <span className="text-xs font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> {t.statusFailed}
                </span>
              ) : (
                <span className="text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {t.statusPassed}
                </span>
              )}
            </div>
            <div className="bg-[#0a0f18] p-5 rounded-xl border border-slate-800/50 text-[11px] overflow-x-auto">
              <pre className="text-cyan-400/90">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}