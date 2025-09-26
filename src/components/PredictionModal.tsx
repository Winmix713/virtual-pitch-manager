import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMatches } from "@/hooks/use-matches";
import { PlayCircle, Loader2, Sparkles } from "lucide-react";
import type { MatchFilters, MatchStats } from "@/lib/supabase";
import { MatchSelector } from "./MatchSelector";
import { PredictionResults } from "./PredictionResults";

// Constants
const MATCH_COUNT = 8;

const CONFIDENCE_THRESHOLDS = {
  HIGH: 65,
  MEDIUM: 50,
  BTTS_QUALIFIED: 55,
  DRAW_HIGHLIGHTED: 30
} as const;

// Extended type definition for prediction quality
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

interface PredictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PredictionResult {
  match: PredictedMatch;
  stats: ExtendedMatchStats | null;
}

// Helper functions
const getRecommendation = (homeWin: number, awayWin: number, draw: number, btts: number) => {
  const maxPercentage = Math.max(homeWin, awayWin, draw);
  let recommendation = "";
  let confidence = "low";

  if (maxPercentage >= CONFIDENCE_THRESHOLDS.HIGH) {
    confidence = "high";
    if (homeWin === maxPercentage) recommendation = "Hazai győzelem";
    else if (awayWin === maxPercentage) recommendation = "Vendég győzelem";
    else recommendation = "Döntetlen (kiemelve)";
  } else if (maxPercentage >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    confidence = "medium";
    if (homeWin === maxPercentage) recommendation = "Hazai győzelem (közepes)";
    else if (awayWin === maxPercentage) recommendation = "Vendég győzelem (közepes)";
    else recommendation = "Döntetlen";
  } else {
    confidence = "low";
    recommendation = "Bizonytalan kimenetel";
  }

  if (btts >= CONFIDENCE_THRESHOLDS.BTTS_QUALIFIED) {
    recommendation += " + BTTS";
  }

  return { recommendation, confidence };
};

const calculateMatchStats = (data: any[]): MatchStats => {
  const totalMatches = data.length;
  const homeWins = data.filter(m => m.result_computed === 'H').length;
  const draws = data.filter(m => m.result_computed === 'D').length;
  const awayWins = data.filter(m => m.result_computed === 'A').length;
  const bttsCount = data.filter(m => m.btts_computed === true).length;
  const comebackCount = data.filter(m => m.comeback_computed === true).length;

  const totalGoals = data.reduce((sum, match) =>
    sum + (match.full_time_home_goals ?? 0) + (match.full_time_away_goals ?? 0), 0
  );
  const homeGoals = data.reduce((sum, match) => sum + (match.full_time_home_goals ?? 0), 0);
  const awayGoals = data.reduce((sum, match) => sum + (match.full_time_away_goals ?? 0), 0);

  const avgGoals = totalMatches > 0 ? totalGoals / totalMatches : 0;
  const homeAvgGoals = totalMatches > 0 ? homeGoals / totalMatches : 0;
  const awayAvgGoals = totalMatches > 0 ? awayGoals / totalMatches : 0;

  // Calculate most frequent results
  const resultCounts = new Map<string, number>();
  data.forEach(match => {
    const homeGoals = match.full_time_home_goals ?? 0;
    const awayGoals = match.full_time_away_goals ?? 0;
    const score = `${homeGoals}:${awayGoals}`;
    resultCounts.set(score, (resultCounts.get(score) || 0) + 1);
  });

  const mostFrequentResults = Array.from(resultCounts.entries())
    .map(([score, count]) => ({
      score,
      count,
      percentage: totalMatches > 0 ? Number(((count / totalMatches) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate halftime transformations
  const transformations = data.filter(match => {
    const htHomeGoals = match.half_time_home_goals ?? 0;
    const htAwayGoals = match.half_time_away_goals ?? 0;
    const htResult = htHomeGoals > htAwayGoals ? 'H' :
                    htHomeGoals < htAwayGoals ? 'A' : 'D';
    const ftResult = match.result_computed;
    return htResult !== ftResult;
  }).length;

  return {
    total_matches: totalMatches,
    home_wins: homeWins,
    draws: draws,
    away_wins: awayWins,
    btts_count: bttsCount,
    comeback_count: comebackCount,
    avg_goals: Number(avgGoals.toFixed(1)),
    home_avg_goals: Number(homeAvgGoals.toFixed(1)),
    away_avg_goals: Number(awayAvgGoals.toFixed(1)),
    home_win_percentage: totalMatches > 0 ? Number(((homeWins / totalMatches) * 100).toFixed(1)) : 0,
    draw_percentage: totalMatches > 0 ? Number(((draws / totalMatches) * 100).toFixed(1)) : 0,
    away_win_percentage: totalMatches > 0 ? Number(((awayWins / totalMatches) * 100).toFixed(1)) : 0,
    btts_percentage: totalMatches > 0 ? Number(((bttsCount / totalMatches) * 100).toFixed(1)) : 0,
    comeback_percentage: totalMatches > 0 ? Number(((comebackCount / totalMatches) * 100).toFixed(1)) : 0,
    most_frequent_results: mostFrequentResults,
    halftime_transformations: transformations
  };
};

const createEmptyMatches = (): PredictedMatch[] => {
  return Array.from({ length: MATCH_COUNT }, (_, index) => ({
    id: index + 1,
    home_team: "",
    away_team: ""
  }));
};

export const PredictionModal = memo(({ open, onOpenChange }: PredictionModalProps) => {
  const { toast } = useToast();
  const { fetchTeams } = useMatches();

  // State management
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<PredictedMatch[]>(createEmptyMatches);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Memoized derived values
  const validMatches = useMemo(() =>
    selectedMatches.filter(match => match.home_team && match.away_team),
    [selectedMatches]
  );

  const validMatchCount = useMemo(() => validMatches.length, [validMatches]);

  const isValid = useMemo(() => validMatches.length > 0, [validMatches]);

  // Load teams when modal opens
  useEffect(() => {
    if (!open) return;

    const loadTeams = async () => {
      try {
        const teamList = await fetchTeams();
        setTeams(teamList);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        toast({
          title: "Hiba történt",
          description: "Nem sikerült betölteni a csapatokat",
          variant: "destructive"
        });
      }
    };

    loadTeams();

    // Reset state when opening
    setSelectedMatches(createEmptyMatches());
    setPredictions([]);
  }, [open, fetchTeams, toast]);

  // Event handlers
  const updateMatch = useCallback((matchId: number, side: 'home' | 'away', team: string) => {
    setSelectedMatches(prev => prev.map(match =>
      match.id === matchId
        ? { ...match, [side === 'home' ? 'home_team' : 'away_team']: team }
        : match
    ));
  }, []);

  const clearMatch = useCallback((matchId: number) => {
    setSelectedMatches(prev => prev.map(match =>
      match.id === matchId
        ? { ...match, home_team: "", away_team: "" }
        : match
    ));
  }, []);

  const clearAllMatches = useCallback(() => {
    setSelectedMatches(createEmptyMatches());
    setPredictions([]);
  }, []);

  const fetchMatchStats = useCallback(async (match: PredictedMatch): Promise<ExtendedMatchStats | null> => {
    try {
      const { supabase } = await import("@/lib/supabase");

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('home_team', match.home_team)
        .eq('away_team', match.away_team);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const stats = calculateMatchStats(data);

      // Apply optimization criteria for predictions
      const homeWinPercentage = stats.home_win_percentage;
      const awayWinPercentage = stats.away_win_percentage;
      const drawPercentage = stats.draw_percentage;
      const bttsPercentage = stats.btts_percentage;

      const optimizedStats: ExtendedMatchStats = {
        ...stats,
        prediction_quality: {
          home_qualified: homeWinPercentage >= CONFIDENCE_THRESHOLDS.HIGH,
          away_qualified: awayWinPercentage >= CONFIDENCE_THRESHOLDS.HIGH,
          draw_highlighted: drawPercentage > CONFIDENCE_THRESHOLDS.DRAW_HIGHLIGHTED,
          btts_qualified: bttsPercentage >= CONFIDENCE_THRESHOLDS.BTTS_QUALIFIED,
          confidence_level: Math.max(homeWinPercentage, awayWinPercentage, drawPercentage),
          ...getRecommendation(homeWinPercentage, awayWinPercentage, drawPercentage, bttsPercentage)
        }
      };

      return optimizedStats;
    } catch (error) {
      console.error(`Error calculating stats for ${match.home_team} vs ${match.away_team}:`, error);
      return null;
    }
  }, []);

  const runPredictions = useCallback(async () => {
    if (validMatches.length === 0) {
      toast({
        title: "Nincs érvényes mérkőzés",
        description: "Legalább egy mérkőzést be kell állítani",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const results: PredictionResult[] = [];

      // Process matches in parallel for better performance
      const statsPromises = validMatches.map(async (match) => {
        const stats = await fetchMatchStats(match);
        return { match, stats };
      });

      const resolvedResults = await Promise.all(statsPromises);
      results.push(...resolvedResults);

      // Sort results by BTTS percentage in descending order
      const sortedResults = results.sort((a, b) => {
        const aBtts = a.stats?.btts_percentage ?? 0;
        const bBtts = b.stats?.btts_percentage ?? 0;
        return bBtts - aBtts;
      });

      setPredictions(sortedResults);

      toast({
        title: "Predikciók elkészültek",
        description: `${results.length} mérkőzés elemzése befejezve (BTTS szerint rendezve)`,
      });

    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült elkészíteni a predikciókat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [validMatches, fetchMatchStats, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-7xl h-[95vh] sm:max-h-[95vh] p-0 glass-card border-white/20 flex flex-col backdrop-blur-xl bg-background/80">
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-emerald-400/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
                Meccsek beállítása
              </DialogTitle>
            </div>
            {validMatchCount > 0 && (
              <div className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                {validMatchCount} / {MATCH_COUNT} meccs beállítva
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-white/70 mt-2">
            Készíts optimalizált elemzést a kiválasztott mérkőzésekről
          </p>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-6 sm:space-y-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Match Selection */}
          <MatchSelector
            matches={selectedMatches}
            teams={teams}
            onUpdateMatch={updateMatch}
            onClearMatch={clearMatch}
            onClearAllMatches={clearAllMatches}
            onRunPredictions={runPredictions}
            loading={loading}
            validMatchCount={validMatchCount}
          />

          {/* Predictions Results */}
          <PredictionResults predictions={predictions} />
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Set display name for debugging
PredictionModal.displayName = 'PredictionModal';

export default PredictionModal;