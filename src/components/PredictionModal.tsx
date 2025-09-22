import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMatches } from "@/hooks/use-matches";
import { PlayCircle, Loader2, Sparkles } from "lucide-react";
import type { MatchFilters, MatchStats } from "@/lib/supabase";
import { MatchSelector } from "./MatchSelector";
import { PredictionResults } from "./PredictionResults";

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

// Optimization helper function
const getRecommendation = (homeWin: number, awayWin: number, draw: number, btts: number) => {
  const maxPercentage = Math.max(homeWin, awayWin, draw);
  let recommendation = "";
  let confidence = "low";
  
  if (maxPercentage >= 65) {
    confidence = "high";
    if (homeWin === maxPercentage) recommendation = "Hazai győzelem";
    else if (awayWin === maxPercentage) recommendation = "Vendég győzelem";
    else recommendation = "Döntetlen (kiemelve)";
  } else if (maxPercentage >= 50) {
    confidence = "medium";
    if (homeWin === maxPercentage) recommendation = "Hazai győzelem (közepes)";
    else if (awayWin === maxPercentage) recommendation = "Vendég győzelem (közepes)";
    else recommendation = "Döntetlen";
  } else {
    confidence = "low";
    recommendation = "Bizonytalan kimenetel";
  }
  
  if (btts >= 55) {
    recommendation += " + BTTS";
  }
  
  return { recommendation, confidence };
};

const PredictionModal = ({ open, onOpenChange }: PredictionModalProps) => {
  const { toast } = useToast();
  const { fetchTeams } = useMatches();
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<PredictedMatch[]>([]);
  const [predictions, setPredictions] = useState<{ match: PredictedMatch; stats: ExtendedMatchStats | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadTeams = async () => {
      const teamList = await fetchTeams();
      setTeams(teamList);
    };

    loadTeams();
    // Initialize 8 empty matches only when opening
    const emptyMatches = Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      home_team: "",
      away_team: ""
    }));
    setSelectedMatches(emptyMatches);
    setPredictions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateMatch = (matchId: number, side: 'home' | 'away', team: string) => {
    setSelectedMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, [side === 'home' ? 'home_team' : 'away_team']: team }
        : match
    ));
  };

  const clearMatch = (matchId: number) => {
    setSelectedMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, home_team: "", away_team: "" }
        : match
    ));
  };

  const runPredictions = async () => {
    const validMatches = selectedMatches.filter(match => match.home_team && match.away_team);
    
    if (validMatches.length === 0) {
      toast({
        title: "Nincs érvényes mérkőzés",
        description: "Legalább egy mérkőzést be kell állítani",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const results: { match: PredictedMatch; stats: ExtendedMatchStats | null }[] = [];

    try {
      // Import the hook to get statistics calculation
      const { useMatches } = await import("@/hooks/use-matches");
      
      for (const match of validMatches) {
        // Create filters for this specific match pair
        const filters: MatchFilters = {
          home_team: match.home_team,
          away_team: match.away_team
        };

        // We'll need to calculate stats manually since we can't use hooks here
        // This is a simplified version - in a real app you'd extract the calculation logic
        try {
          const { supabase } = await import("@/lib/supabase");
          
          let query = supabase
            .from('matches')
            .select('*');

          if (filters.home_team) {
            query = query.eq('home_team', filters.home_team);
          }
          if (filters.away_team) {
            query = query.eq('away_team', filters.away_team);
          }

          const { data, error } = await query;

          if (error) throw error;

          if (data && data.length > 0) {
            const totalMatches = data.length;
            const homeWins = data.filter(m => m.result_computed === 'H').length;
            const draws = data.filter(m => m.result_computed === 'D').length;
            const awayWins = data.filter(m => m.result_computed === 'A').length;
            const bttsCount = data.filter(m => m.btts_computed === true).length;
            const comebackCount = data.filter(m => m.comeback_computed === true).length;
          
            const totalGoals = data.reduce((sum, match) => 
              sum + match.full_time_home_goals + match.full_time_away_goals, 0
            );
            const homeGoals = data.reduce((sum, match) => sum + match.full_time_home_goals, 0);
            const awayGoals = data.reduce((sum, match) => sum + match.full_time_away_goals, 0);
            const avgGoals = totalGoals / totalMatches;
            const homeAvgGoals = homeGoals / totalMatches;
            const awayAvgGoals = awayGoals / totalMatches;

            // Calculate most frequent results
            const resultCounts = new Map<string, number>();
            data.forEach(match => {
              const score = `${match.full_time_home_goals}:${match.full_time_away_goals}`;
              resultCounts.set(score, (resultCounts.get(score) || 0) + 1);
            });
            
            const mostFrequentResults = Array.from(resultCounts.entries())
              .map(([score, count]) => ({
                score,
                count,
                percentage: Number(((count / totalMatches) * 100).toFixed(1))
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            // Calculate halftime transformations
            const transformations = data.filter(match => {
              const htResult = match.half_time_home_goals > match.half_time_away_goals ? 'H' : 
                             match.half_time_home_goals < match.half_time_away_goals ? 'A' : 'D';
              const ftResult = match.result_computed;
              return htResult !== ftResult;
            }).length;

            const stats: MatchStats = {
              total_matches: totalMatches,
              home_wins: homeWins,
              draws: draws,
              away_wins: awayWins,
              btts_count: bttsCount,
              comeback_count: comebackCount,
              avg_goals: Number(avgGoals.toFixed(1)),
              home_avg_goals: Number(homeAvgGoals.toFixed(1)),
              away_avg_goals: Number(awayAvgGoals.toFixed(1)),
              home_win_percentage: Number(((homeWins / totalMatches) * 100).toFixed(1)),
              draw_percentage: Number(((draws / totalMatches) * 100).toFixed(1)),
              away_win_percentage: Number(((awayWins / totalMatches) * 100).toFixed(1)),
              btts_percentage: Number(((bttsCount / totalMatches) * 100).toFixed(1)),
              comeback_percentage: Number(((comebackCount / totalMatches) * 100).toFixed(1)),
              most_frequent_results: mostFrequentResults,
              halftime_transformations: transformations
            };

            // Apply optimization criteria for predictions
            const homeWinPercentage = Number(((homeWins / totalMatches) * 100).toFixed(1));
            const awayWinPercentage = Number(((awayWins / totalMatches) * 100).toFixed(1));
            const drawPercentage = Number(((draws / totalMatches) * 100).toFixed(1));
            const bttsPercentage = Number(((bttsCount / totalMatches) * 100).toFixed(1));

            const optimizedStats: ExtendedMatchStats = {
              ...stats,
              prediction_quality: {
                home_qualified: homeWinPercentage >= 65,
                away_qualified: awayWinPercentage >= 65,
                draw_highlighted: drawPercentage > 30,
                btts_qualified: bttsPercentage >= 55,
                confidence_level: Math.max(homeWinPercentage, awayWinPercentage, drawPercentage),
                ...getRecommendation(homeWinPercentage, awayWinPercentage, drawPercentage, bttsPercentage)
              }
            };

            results.push({ match, stats: optimizedStats });
          } else {
            results.push({ match, stats: null });
          }
        } catch (error) {
          console.error(`Error calculating stats for ${match.home_team} vs ${match.away_team}:`, error);
          results.push({ match, stats: null });
        }
      }

      // Sort results by BTTS percentage in descending order
      const sortedResults = results.sort((a, b) => {
        const aBtts = a.stats?.btts_percentage || 0;
        const bBtts = b.stats?.btts_percentage || 0;
        return bBtts - aBtts;
      });

      setPredictions(sortedResults);
      toast({
        title: "Predikciók elkészültek",
        description: `${results.length} mérkőzés elemzése befejezve (BTTS szerint rendezve)`,
      });

    } catch (error) {
      toast({
        title: "Hiba történt",
        description: "Nem sikerült elkészíteni a predikciókat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = selectedMatches.some(match => match.home_team && match.away_team);
  const validMatchCount = selectedMatches.filter(match => match.home_team && match.away_team).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-7xl h-[95vh] sm:max-h-[95vh] p-0 glass-card border-white/20 flex flex-col">
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Predikció készítése
          </DialogTitle>
          <p className="text-sm sm:text-base text-white/70 mt-2">
            Készíts optimalizált elemzést a kiválasztott mérkőzésekről
          </p>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-6 sm:space-y-8"
             style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Match Selection */}
          <MatchSelector 
            matches={selectedMatches}
            teams={teams}
            onUpdateMatch={updateMatch}
            onClearMatch={clearMatch}
          />

          {/* Run Predictions Section */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 mx-auto max-w-md">
            <div className="text-center space-y-3">
              {validMatchCount > 0 && (
                <div className="text-sm text-white/80">
                  <span className="font-medium text-primary">{validMatchCount}</span> mérkőzés kiválasztva
                </div>
              )}
              
              <Button
                onClick={runPredictions}
                disabled={!isValid || loading}
                className="w-full winmix-btn-primary winmix-hover-lift winmix-focus text-base sm:text-lg py-3 sm:py-4 h-auto touch-manipulation"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Elemzés folyamatban...
                  </>
                ) : (
                  <>
                    <PlayCircle className="size-5 mr-2" />
                    Futtatás
                  </>
                )}
              </Button>
              
              {!isValid && (
                <p className="text-xs text-white/60">
                  Válassz ki legalább egy mérkőzést az elemzéshez
                </p>
              )}
            </div>
          </div>

          {/* Predictions Results */}
          <PredictionResults predictions={predictions} />
         </div>
      </DialogContent>
    </Dialog>
  );
};

export default PredictionModal;