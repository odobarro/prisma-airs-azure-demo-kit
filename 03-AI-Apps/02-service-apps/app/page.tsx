'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Cpu, Terminal, Shield, AlertTriangle, Database, Cloud, Key, FileInput, HelpCircle, ExternalLink, Settings, Plus, Trash2 } from 'lucide-react';

interface SecurityGroup {
  name: string;
  uuid: string;
}

interface SourceCatalogItem {
  groups: SecurityGroup[];
  presetUrl: string;
  presetToken?: string;
}

const INITIAL_CATALOG: Record<string, SourceCatalogItem> = {
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
  }
};

type ModelSource = 'HuggingFace' | 'GitLab';

const i18n = {
  es: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Análisis de modelos y artefactos desde Prisma AIRS.',
    sourceLabel: 'Origen del Modelo (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'URL del Artefacto o Repositorio',
    tokenLabel: 'Token de Acceso (GitLab PAT)',
    loadPreset: 'Cargar Modelo de Ejemplo',
    scanBtn: 'Auditar Artefacto / Modelo',
    scanning: 'Ejecutando motor de escaneo en Prisma AIRS...',
    resultsTitle: 'Veredicto Prisma AIRS',
    statusPassed: 'APROBADO PARA DESPLIEGUE',
    statusFailed: 'RIESGO DETECTADO - BLOQUEADO',
    sumTotal: 'Reglas Evaluadas',
    sumPassed: 'Reglas Aprobadas',
    sumFailed: 'Violaciones Detectadas',
    ruleTh: 'Regla Violada & Amenaza',
    detailTh: 'Detalle Técnico & Archivo',
    remediationTitle: 'Recomendaciones de Remediación:',
    rawResponse: 'Telemetría de Inspección (Raw Payload)',
    manageBtn: 'Gestionar Grupos de Políticas',
    createGroupTitle: 'Crear Nuevo Grupo de Políticas en SCM',
    groupNamePlaceholder: 'Ej. Grupo de Producción Estricto',
    createBtn: 'Crear Grupo',
  },
  en: {
    badge: 'PRISMA AIRS • AI SUPPLY CHAIN SECURITY',
    title: 'Model Validation Hub',
    subtitle: 'Model and artifact analysis from Prisma AIRS.',
    sourceLabel: 'Model Origin (Provider)',
    groupLabel: 'Security Policy Group (SCM)',
    modelUrlLabel: 'Artifact or Repository URL',
    tokenLabel: 'Access Token (GitLab PAT)',
    loadPreset: 'Load Preset Example',
    scanBtn: 'Audit Artifact / Model',
    scanning: 'Running scan engine in Prisma AIRS...',
    resultsTitle: 'Prisma AIRS Verdict',
    statusPassed: 'APPROVED FOR DEPLOYMENT',
    statusFailed: 'RISK DETECTED - BLOCKED',
    sumTotal: 'Evaluated Rules',
    sumPassed: 'Passed Rules',
    sumFailed: 'Detected Violations',
    ruleTh: 'Violated Rule & Threat',
    detailTh: 'Technical Detail & File',
    remediationTitle: 'Remediation Guidelines:',
    rawResponse: 'Inspection Telemetry (Raw Payload)',
    manageBtn: 'Manage Policy Groups',
    createGroupTitle: 'Create New Policy Group in SCM',
    groupNamePlaceholder: 'Ex. Strict Production Group',
    createBtn: 'Create Group',
  },
};

export default function SecurityHubPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [catalog, setCatalog] = useState<Record<string, SourceCatalogItem>>(INITIAL_CATALOG);
  const [source, setSource] = useState<ModelSource>('HuggingFace');
  const [groupId, setGroupId] = useState<string>('');
  const [modelUrl, setModelUrl] = useState<string>('');
  const [privateToken, setPrivateToken] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [showManager, setShowManager] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupType, setNewGroupType] = useState<ModelSource>('HuggingFace');
  const [managerLoading, setManagerLoading] = useState<boolean>(true); 

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const data = await res.json();
          
          // FIX: Forzamos a TypeScript a entender que estos arrays vacíos son de tipo SecurityGroup[]
          const updatedCatalog: Record<string, SourceCatalogItem> = {
            HuggingFace: { ...INITIAL_CATALOG.HuggingFace, groups: [] as SecurityGroup[] },
            GitLab: { ...INITIAL_CATALOG.GitLab, groups: [] as SecurityGroup[] }
          };

          data.forEach((g: any) => {
            const uiProvider = (g.provider === 'GITLAB' || g.provider === 'GitLab') ? 'GitLab' : 'HuggingFace';
            updatedCatalog[uiProvider].groups.push({ name: g.name, uuid: g.uuid });
          });

          if (updatedCatalog.HuggingFace.groups.length === 0) updatedCatalog.HuggingFace.groups = INITIAL_CATALOG.HuggingFace.groups;
          if (updatedCatalog.GitLab.groups.length === 0) updatedCatalog.GitLab.groups = INITIAL_CATALOG.GitLab.groups;

          setCatalog(updatedCatalog);
          
          if (updatedCatalog.HuggingFace.groups.length > 0) {
            setGroupId(updatedCatalog.HuggingFace.groups[0].uuid);
          }
        }
      } catch (err) {
        console.error("Error sincronizando grupos con SCM:", err);
      } finally {
        setManagerLoading(false);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    if (catalog[source]?.groups.length > 0) {
      setGroupId(catalog[source].groups[0].uuid);
    } else {
      setGroupId('');
    }
    setModelUrl('');
    setPrivateToken('');
  }, [source, catalog]);

  const handleLoadPreset = () => {
    const catalogItem = catalog[source];
    setModelUrl(catalogItem.presetUrl);
    if (catalogItem.presetToken) setPrivateToken(catalogItem.presetToken);
    else setPrivateToken('');
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload: Record<string, any> = { model_url: modelUrl, group_id: groupId };
      if (source === 'GitLab' && privateToken) payload.gitlab_token = privateToken;

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

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    setManagerLoading(true);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, provider: newGroupType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el grupo en SCM');

      setCatalog(prev => {
        const updated = { ...prev };
        updated[newGroupType].groups.push({ name: data.name, uuid: data.uuid });
        return updated;
      });

      setNewGroupName('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setManagerLoading(false);
    }
  };

  const handleDeleteGroup = async (groupUuid: string, groupType: ModelSource) => {
    setManagerLoading(true);
    try {
      const res = await fetch(`/api/groups?uuid=${encodeURIComponent(groupUuid)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar el grupo en SCM');
      }

      setCatalog(prev => {
        const updated = { ...prev };
        updated[groupType].groups = updated[groupType].groups.filter(g => g.uuid !== groupUuid);
        return updated;
      });
      
      if (groupId === groupUuid && catalog[groupType].groups.length > 0) {
        setGroupId(catalog[groupType].groups[0].uuid);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setManagerLoading(false);
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

        <div className="flex justify-end mb-4">
          <button onClick={() => setShowManager(!showManager)} className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors text-cyan-400 shadow-sm">
            <Settings className="w-4 h-4" /> {t.manageBtn}
          </button>
        </div>

        {showManager && (
          <div className="bg-[#111827] border border-cyan-900/50 rounded-xl p-5 mb-8 animate-in fade-in slide-in-from-top-2 shadow-lg">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 border-b border-slate-800 pb-2">{t.createGroupTitle}</h3>
            
            <form onSubmit={handleCreateGroup} className="flex flex-col md:flex-row items-end gap-4 mb-6">
              <div className="flex-1 w-full">
                <label className="block text-[10px] uppercase text-slate-500 mb-1">Nombre del Grupo</label>
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)} 
                  disabled={managerLoading}
                  className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 text-slate-200" 
                  placeholder={t.groupNamePlaceholder} 
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-[10px] uppercase text-slate-500 mb-1">Proveedor</label>
                <select 
                  value={newGroupType} 
                  onChange={e => setNewGroupType(e.target.value as ModelSource)} 
                  disabled={managerLoading}
                  className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none text-slate-300"
                >
                  <option value="HuggingFace">HuggingFace</option>
                  <option value="GitLab">GitLab</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={managerLoading || !newGroupName} 
                className="w-full md:w-auto bg-cyan-900 hover:bg-cyan-800 text-cyan-100 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 font-bold disabled:opacity-50 border border-cyan-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> {t.createBtn}
              </button>
            </form>

            <div className="space-y-4">
              {managerLoading && <div className="text-xs text-cyan-500 animate-pulse">Sincronizando con SCM...</div>}
              {!managerLoading && (Object.keys(catalog) as ModelSource[]).map(type => (
                <div key={type}>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{type}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {catalog[type].groups.map(g => (
                      <div key={g.uuid} className="flex items-center justify-between bg-[#0a0f18] border border-slate-800 p-3 rounded-lg">
                        <span className="text-xs font-bold text-slate-300 truncate">{g.name}</span>
                        <button 
                          onClick={() => handleDeleteGroup(g.uuid, type)} 
                          disabled={managerLoading}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-7 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-indigo-600 opacity-80"></div>
          
          <form onSubmit={handleScan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <Cloud className="w-3.5 h-3.5 text-cyan-600" /> {t.sourceLabel}
                 </label>
                 <select value={source} onChange={(e) => setSource(e.target.value as ModelSource)} disabled={loading || managerLoading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-cyan-300 focus:border-cyan-500 outline-none appearance-none">
                   {(Object.keys(catalog) as ModelSource[]).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> {t.groupLabel}
                 </label>
                 <select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={loading || managerLoading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-indigo-500 outline-none appearance-none">
                   {catalog[source].groups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
                 </select>
               </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                 <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" /> {t.modelUrlLabel}
                 </label>
                 {catalog[source].presetUrl && (
                   <button type="button" onClick={handleLoadPreset} className="text-[10px] flex items-center gap-1 bg-cyan-950/50 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/50 px-2 py-1 rounded transition-colors">
                      <FileInput className="w-3 h-3" /> {t.loadPreset}
                   </button>
                 )}
              </div>
              <input type="text" value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} disabled={loading} required className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 focus:border-cyan-500 outline-none" placeholder="https://..." />
            </div>

            {source === 'GitLab' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                   <Key className="w-3.5 h-3.5 text-amber-500" /> {t.tokenLabel}
                </label>
                <input type="password" value={privateToken} onChange={(e) => setPrivateToken(e.target.value)} disabled={loading} className="w-full bg-[#0a0f18] border border-slate-700 rounded-lg px-4 py-3 text-sm text-amber-300/80 focus:border-amber-500 outline-none" placeholder="Opcional (Ej. glpat-XXXX...)" />
              </div>
            )}

            <button type="submit" disabled={loading || managerLoading} className="w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 disabled:from-slate-800 text-white font-bold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] hover:-translate-y-0.5">
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
                                 {v.remediation?.steps && v.remediation.steps.length > 0 && (
                                    <div className="mt-2 bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-[11px] text-slate-300">
                                       <span className="block font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                                          <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
                                          {t.remediationTitle}
                                       </span>
                                       <ul className="list-disc list-inside space-y-1 text-slate-400">
                                          {v.remediation.steps.map((step: string, sIdx: number) => (
                                             <li key={sIdx}>{step}</li>
                                          ))}
                                       </ul>
                                       {v.remediation.url && (
                                          <a href={v.remediation.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 mt-2 font-semibold text-[10px] underline">
                                             SCM Documentation <ExternalLink className="w-3 h-3" />
                                          </a>
                                       )}
                                    </div>
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