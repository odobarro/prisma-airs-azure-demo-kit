'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Cpu, Terminal, Shield, AlertTriangle, Database, Cloud, Key, FileInput, HelpCircle, ExternalLink } from 'lucide-react';

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
    presetUrl: 'https://odstgairsdemo001.blob.core.windows.net/od-ai-models-scan/mnist-8.onnx',
    // Usamos un flag seguro. El token real NO viaja ni existe en el frontend.
    presetToken: '***AZURE_SECURE_PRESET***' 
  }
};

type ModelSource = keyof typeof SOURCES_CATALOG;

// ... (Mantén el diccionario i18n exactamente igual) ...
const i18n = {
  es: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Análisis estático en tiempo real contra políticas de Strata Cloud Manager.',
    sourceLabel: 'Origen del Modelo (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'URL del Artefacto o Repositorio',
    tokenLabel: 'Token de Acceso (GitLab PAT / Azure Key)',
    loadPreset: 'Cargar Modelo de Ejemplo',
    scanBtn: 'Auditar Artefacto',
    scanning: 'Ejecutando motor Idira en Azure...',
    resultsTitle: 'Veredicto SCM',
    statusPassed: 'APROBADO PARA DESPLIEGUE',
    statusFailed: 'RIESGO DETECTADO - BLOQUEADO',
    sumTotal: 'Reglas Evaluadas',
    sumPassed: 'Reglas Aprobadas',
    sumFailed: 'Violaciones SCM',
    ruleTh: 'Regla Violada & Amenaza',
    detailTh: 'Detalle Técnico & Archivo',
    remediationTitle: 'Recomendaciones de Remediación:',
    rawResponse: 'Telemetría de Inspección (Raw Payload)',
  },
  en: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Real-time static analysis against Strata Cloud Manager policies.',
    sourceLabel: 'Model Origin (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'Artifact or Repository URL',
    tokenLabel: 'Access Token (GitLab PAT / Azure Key)',
    loadPreset: 'Load Preset Example',
    scanBtn: 'Audit Artifact',
    scanning: 'Running Idira engine in Azure...',
    resultsTitle: 'SCM Verdict',
    statusPassed: 'APPROVED FOR DEPLOYMENT',
    statusFailed: 'RISK DETECTED - BLOCKED',
    sumTotal: 'Evaluated Rules',
    sumPassed: 'Passed Rules',
    sumFailed: 'SCM Violations',
    ruleTh: 'Violated Rule & Threat',
    detailTh: 'Technical Detail & File',
    remediationTitle: 'Remediation Guidelines:',
    rawResponse: 'Inspection Telemetry (Raw Payload)',
  },
};

export default function SecurityHubPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [source, setSource] = useState<ModelSource>('HuggingFace');
  const [groupId, setGroupId] = useState(SOURCES_CATALOG['HuggingFace'].groups[0].uuid);
  const [modelUrl, setModelUrl] = useState('');
  
  // Estado unificado para tokens privados
  const [privateToken, setPrivateToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const t = i18n[lang];

  useEffect(() => {
    setGroupId(SOURCES_CATALOG[source].groups[0].uuid);
    setModelUrl('');
    setPrivateToken('');
  }, [source]);

  const handleLoadPreset = () => {
    setModelUrl(SOURCES_CATALOG[source].presetUrl);
    if (SOURCES_CATALOG[source].presetToken) {
      setPrivateToken(SOURCES_CATALOG[source].presetToken);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload: any = { model_url: modelUrl, group_id: groupId };
      
      // Enviamos el token al backend correspondiente
      if (source === 'GitLab' && privateToken) payload.gitlab_token = privateToken;
      if (source === 'Azure' && privateToken) payload.azure_token = privateToken;

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo en la comunicación con el proxy de Prisma AIRS.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = result?.eval_outcome === 'BLOCKED' || (result?.violations && result?.violations.length > 0);
  const totalRules = result?.eval_summary?.total_rules || result?.enabled_rule_count_snapshot || 0;
  const passedRules = result?.eval_summary?.rules_passed || 0;
  const failedRules = result?.eval_summary?.rules_failed || result?.violations?.length || 0;

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 font-mono selection:bg-cyan-900 pb-20">
      <header className="border-b border-slate-800/60 bg-[#0a0f18]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-slate-700/50 rounded-lg shadow-inner">
            <Shield className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="font-semibold text-sm text-slate-300">Palo Alto Networks <span className="text-cyan-600 ml-1">| SecOps</span></span>
        </div>
        <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="flex items-center gap-2 text-xs bg-slate-900/50 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/50 transition-colors">
          <Globe className="w-3.5 h-3.5 text-cyan-500" /> {lang.toUpperCase()}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <span className="inline-block text-[10px] tracking-[0.2em] font-bold uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 px-3 py-1.5 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
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
                 <select value={source} onChange={(e) => setSource(e.target.value as ModelSource)} disabled={loading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-cyan-300 focus:border-cyan-500 outline-none appearance-none">
                   {(Object.keys(SOURCES_CATALOG) as ModelSource[]).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> {t.groupLabel}
                 </label>
                 <select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={loading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none appearance-none">
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
              <input type="text" value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} disabled={loading} required className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-cyan-500 outline-none" placeholder="https://..." />
            </div>

            {(source === 'GitLab' || source === 'Azure') && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <Key className="w-3.5 h-3.5 text-amber-500" /> {t.tokenLabel}
                </label>
                <input type="password" value={privateToken} onChange={(e) => setPrivateToken(e.target.value)} disabled={loading} required className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-amber-300/80 focus:border-amber-500 outline-none" placeholder="************************" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 disabled:from-slate-800 text-white font-bold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] hover:-translate-y-0.5">
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
          <div className="bg-[#111827] border border-slate-800/80 rounded-xl p-7 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
              <h2 className="text-lg font-bold text-white">{t.resultsTitle}</h2>
              {isBlocked ? (
                <span className="text-xs font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.3)]">
                  <ShieldAlert className="w-4 h-4" /> {t.statusFailed}
                </span>
              ) : (
                <span className="text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                  <ShieldCheck className="w-4 h-4" /> {t.statusPassed}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
               <div className="bg-[#0a0f18] border border-slate-800 p-4 rounded-xl text-center shadow-inner">
                  <span className="block text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">{t.sumTotal}</span>
                  <span className="text-2xl font-bold text-slate-300">{totalRules}</span>
               </div>
               <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl text-center shadow-inner">
                  <span className="block text-xs text-emerald-600/80 uppercase font-semibold tracking-wider mb-1">{t.sumPassed}</span>
                  <span className="text-2xl font-bold text-emerald-400">{passedRules}</span>
               </div>
               <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl text-center shadow-inner">
                  <span className="block text-xs text-rose-600/80 uppercase font-semibold tracking-wider mb-1">{t.sumFailed}</span>
                  <span className="text-2xl font-bold text-rose-400">{failedRules}</span>
               </div>
            </div>

            {result.violations && result.violations.length > 0 && (
               <div className="mb-6 overflow-hidden rounded-xl border border-rose-900/50 shadow-inner">
                  <table className="w-full text-left border-collapse text-[13px]">
                     <thead>
                        <tr className="bg-rose-950/40 text-rose-400 border-b border-rose-900/50">
                           <th className="py-3 px-4 font-semibold">{t.ruleTh}</th>
                           <th className="py-3 px-4 font-semibold">{t.detailTh}</th>
                        </tr>
                     </thead>
                     <tbody className="bg-[#0a0f18]">
                        {result.violations.map((v: any, i: number) => (
                           <tr key={i} className="border-b border-slate-800/80 last:border-0">
                              <td className="py-4 px-4 text-slate-300 font-semibold align-top w-1/3">
                                 <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span className="text-white font-bold">{v.rule_name || 'Policy Violation'}</span>
                                 </div>
                                 <span className="inline-block text-[10px] bg-rose-950/80 border border-rose-800/80 text-rose-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                    {v.threat || 'RISK_DETECTED'}
                                 </span>
                              </td>
                              <td className="py-4 px-4 text-slate-400 align-top">
                                 <p className="text-rose-200/90 font-medium mb-1.5 leading-relaxed">
                                    {v.description || v.threat_description}
                                 </p>
                                 {v.file && (
                                    <span className="inline-block text-[11px] bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-cyan-400 font-mono mb-2">
                                       File: {v.file}
                                    </span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            <div className="bg-[#0a0f18] p-5 rounded-xl border border-slate-800/50 text-[11px] overflow-x-auto">
              <span className="text-slate-500 block mb-3 font-semibold tracking-wider">/* {t.rawResponse} */</span>
              <pre className="text-cyan-400/90 font-mono">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}