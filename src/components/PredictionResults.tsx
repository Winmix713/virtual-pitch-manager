
import { CheckCircle, AlertTriangle, TrendingUp, Target, BarChart3 } from "lucide-react";
import type { MatchStats } from "@/lib/supabase";

// Add the extended type definition for prediction quality
interface ExtendedMatchStats extends MatchStats {
  prediction_quality?: {
    home_qualified: boolean;
    away_qualified: boolean;
    draw_highlighted: boolean;
    btts_qualified: boolean;
    confidence_level: number;
    recommendation: string;
    confidence: string;
  };
}

interface PredictedMatch {
  id: number;
  home_team: string;
  away_team: string;
}

interface PredictionResultsProps {
  predictions: { match: PredictedMatch; stats: ExtendedMatchStats | null }[];
}

export const PredictionResults = ({ predictions }: PredictionResultsProps) => {
  if (predictions.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with criteria info */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold text-white">Optimalizált predikciós eredmények</h3>
        </div>
        
        <div className="inline-flex flex-wrap items-center gap-2 text-xs bg-white/5 px-3 py-2 rounded-full border border-white/10">
          <span className="text-white/80">Kritériumok:</span>
          <span className="text-success">≥65% győzelem</span>
          <span className="text-warning">&gt;30% döntetlen</span>
          <span className="text-primary">≥55% BTTS</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {predictions.map(({ match, stats }, index) => (
          <section key={index} className="relative bg-black/60 w-full max-w-md border-white/10 border rounded-3xl shadow-2xl backdrop-blur-xl">
            {/* Top border glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="relative sm:p-6 pt-5 pr-5 pb-5 pl-5">
              {/* Teams */}
              <div className="grid grid-cols-3 gap-2 mb-3 items-center">
                {/* Home Team */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="grid h-12 w-12 place-items-center rounded-full ring-2 ring-white/10 shadow-inner shadow-black/30" style={{background: 'radial-gradient(100% 100% at 50% 50%, #3b82f6 0%, #1e40af 100%)'}}>
                      <span className="text-base font-semibold tracking-tight text-white/95">
                        {match.home_team.charAt(0)}
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"></div>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold tracking-tight">{match.home_team}</p>
                  <p className="text-[11px] font-medium text-white/50">Hazai</p>
                </div>

                {/* VS / H2H */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">H2H mérkőzés</span>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600">
                    {stats?.total_matches || 0}
                  </div>
                  <div className="mt-2 h-5 w-px bg-white/10"></div>
                  <span className="sr-only">Összes egymás elleni</span>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="grid h-12 w-12 place-items-center rounded-full ring-2 ring-white/10 shadow-inner shadow-black/30" style={{background: 'radial-gradient(100% 100% at 50% 50%, #ef4444 0%, #dc2626 100%)'}}>
                      <span className="text-base font-semibold tracking-tight text-white/95">
                        {match.away_team.charAt(0)}
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"></div>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold tracking-tight">{match.away_team}</p>
                  <p className="text-[11px] font-medium text-white/50">Vendég</p>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full my-2"></div>

              {/* H2H summary */}
              <div className="bg-white/5 border-white/10 border rounded-2xl mt-3 pt-4 pr-4 pb-4 pl-4">
                <h2 className="mb-3 text-center text-base font-semibold tracking-tight">Egymás elleni mérleg</h2>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <div className="text-xl font-semibold tracking-tight text-blue-400">{stats?.home_wins || 0}</div>
                    <div className="mt-0.5 text-xs font-medium text-white/60">{match.home_team} győzelem</div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-lg font-semibold tracking-tight text-amber-400">{stats?.draws || 0}</div>
                    <div className="mt-0.5 text-[11px] font-medium uppercase text-white/60">Döntetlen</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                    <div className="text-xl font-semibold tracking-tight text-rose-400">{stats?.away_wins || 0}</div>
                    <div className="mt-0.5 text-xs font-medium text-white/60">{match.away_team} győzelem</div>
                  </div>
                </div>
              </div>

              {/* Detailed percentages */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-colors hover:bg-white/[0.07]">
                  <div className="text-lg font-semibold tracking-tight text-emerald-400">{stats?.home_win_percentage || 0}%</div>
                  <div className="mt-1 text-xs font-medium text-white/70">{match.home_team} győzelmi arány</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition-colors hover:bg-white/[0.07]">
                  <div className="text-lg font-semibold tracking-tight text-emerald-400">{stats?.away_win_percentage || 0}%</div>
                  <div className="mt-1 text-xs font-medium text-white/70">{match.away_team} győzelmi arány</div>
                </div>
              </div>

              {/* Goals analysis */}
              <div className="bg-emerald-500/5 border-emerald-500/20 border rounded-2xl mt-3 pt-4 pr-4 pb-4 pl-4">
                <h3 className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide text-emerald-300">Gól statisztikák</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                    <div className="text-base font-semibold tracking-tight">{stats?.home_avg_goals || '0.0'}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-white/60">{match.home_team} átlag</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                    <div className="text-base font-semibold tracking-tight">{stats?.avg_goals || '0.0'}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-white/60">Meccs átlag</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                    <div className="text-base font-semibold tracking-tight">{stats?.away_avg_goals || '0.0'}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-white/60">{match.away_team} átlag</div>
                  </div>
                </div>

                {/* BTTS */}
                <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/10 p-3 text-center">
                  <div className="mb-1 inline-flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-violet-300">
                      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
                    </svg>
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-violet-200">Mindkét csapat szerez</span>
                  </div>
                  <div className="text-xl font-semibold tracking-tight">{stats?.btts_percentage || 0}%</div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-300" 
                      style={{width: `${stats?.btts_percentage || 0}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Common scores */}
              {stats?.most_frequent_results && stats.most_frequent_results.length > 0 && (
                <div className="bg-white/5 border-white/10 border rounded-2xl mt-3 pt-4 pr-4 pb-4 pl-4">
                  <h4 className="mb-3 text-center text-[13px] font-semibold uppercase tracking-wide">Leggyakoribb eredmények</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {stats.most_frequent_results.slice(0, 3).map((result, idx) => (
                      <button 
                        key={idx} 
                        className="group rounded-lg border border-white/10 bg-white/5 p-2 text-center outline-none transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                      >
                        <div className="text-[15px] font-semibold tracking-tight">{result.score}</div>
                        <div className="mt-0.5 text-xs font-medium text-emerald-400">{result.percentage}%</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!stats && (
                <div className="text-center py-6 sm:py-8">
                  <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
                  <p className="text-white/70 text-sm">
                    Nincs elegendő adat az elemzéshez
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};