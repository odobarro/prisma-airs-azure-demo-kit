{/* Panel de Resultados con soporte para estado Aceptado/En Cola */}
{result && (
  <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-7 shadow-2xl shadow-black/50">
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
      <h2 className="text-lg font-bold text-white tracking-tight">{t.resultsTitle}</h2>
      
      {result.status === 'accepted' || result.status === 'queued' ? (
        <span className="text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          ⏳ ESCANEO EN COLA / EN PROCESO
        </span>
      ) : result.status === 'PASSED' || result.verdict === 'ALLOW' ? (
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