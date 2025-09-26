import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface PredictedMatch {
  id: number;
  home_team: string;
  away_team: string;
}

interface MatchSelectorProps {
  matches: PredictedMatch[];
  teams: string[];
  onUpdateMatch: (matchId: number, side: 'home' | 'away', team: string) => void;
  onClearMatch: (matchId: number) => void;
  onClearAllMatches?: () => void;
  onRunPredictions?: () => void;
  loading?: boolean;
  validMatchCount?: number;
}

export const MatchSelector = ({ matches, teams, onUpdateMatch, onClearMatch, onClearAllMatches, onRunPredictions, loading = false, validMatchCount = 0 }: MatchSelectorProps) => {
  const getUsedTeams = () => {
    const used = new Set<string>();
    matches.forEach(match => {
      if (match.home_team) used.add(match.home_team);
      if (match.away_team) used.add(match.away_team);
    });
    return used;
  };

  const getAvailableTeams = (currentMatchId: number, side: 'home' | 'away') => {
    const usedTeams = getUsedTeams();
    const currentMatch = matches.find(m => m.id === currentMatchId);
    
    return teams.filter(team => {
      if (usedTeams.has(team)) {
        if (side === 'home' && team === currentMatch?.home_team) return true;
        if (side === 'away' && team === currentMatch?.away_team) return true;
        return false;
      }
      if (side === 'home' && team === currentMatch?.away_team) return false;
      if (side === 'away' && team === currentMatch?.home_team) return false;
      return true;
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Mérkőzések beállítása</h3>
        <p className="text-sm text-white/70">Válassz ki legfeljebb 8 mérkőzést az elemzéshez</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="glass-card border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/90">
                  {match.id}. mérkőzés
                </h4>
                {(match.home_team || match.away_team) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClearMatch(match.id)}
                    className="text-white/60 hover:text-white p-1 h-auto hover:bg-white/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block font-medium">
                    Hazai csapat
                  </label>
                  <Select
                    value={match.home_team}
                    onValueChange={(value) => onUpdateMatch(match.id, 'home', value)}
                  >
                    <SelectTrigger className="bg-background/80 border-white/20 text-white backdrop-blur-sm h-10 text-sm touch-manipulation">
                      <SelectValue placeholder="Válassz hazai csapatot" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border-white/20 z-[60] max-h-60">
                      {getAvailableTeams(match.id, 'home').map((team) => (
                        <SelectItem 
                          key={team} 
                          value={team} 
                          className="text-white hover:bg-white/10 focus:bg-white/10 py-2.5 px-3 text-sm cursor-pointer"
                        >
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-center text-white/40 text-xs">VS</div>

                <div>
                  <label className="text-xs text-white/60 mb-1.5 block font-medium">
                    Vendég csapat
                  </label>
                  <Select
                    value={match.away_team}
                    onValueChange={(value) => onUpdateMatch(match.id, 'away', value)}
                  >
                    <SelectTrigger className="bg-background/80 border-white/20 text-white backdrop-blur-sm h-10 text-sm touch-manipulation">
                      <SelectValue placeholder="Válassz vendég csapatot" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-md border-white/20 z-[60] max-h-60">
                      {getAvailableTeams(match.id, 'away').map((team) => (
                        <SelectItem 
                          key={team} 
                          value={team} 
                          className="text-white hover:bg-white/10 focus:bg-white/10 py-2.5 px-3 text-sm cursor-pointer"
                        >
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Action buttons section */}
      {(onClearAllMatches || onRunPredictions) && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-white/10 mx-auto max-w-md mt-6">
          <div className="text-center space-y-3">
            {validMatchCount > 0 && (
              <div className="text-sm text-white/80">
                <span className="font-medium text-primary">{validMatchCount}</span> mérkőzés kiválasztva
              </div>
            )}
            
            <div className="flex gap-2">
              {onClearAllMatches && validMatchCount > 0 && (
                <Button
                  onClick={onClearAllMatches}
                  variant="outline"
                  className="flex-1 winmix-btn-glass"
                  disabled={loading}
                >
                  Összes törlése
                </Button>
              )}
              
              {onRunPredictions && (
                <Button
                  onClick={onRunPredictions}
                  disabled={validMatchCount === 0 || loading}
                  className="flex-1 winmix-btn-primary winmix-hover-lift winmix-focus text-base sm:text-lg py-3 sm:py-4 h-auto touch-manipulation"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Elemzés...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-1V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2z" />
                      </svg>
                      Futtatás
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {validMatchCount === 0 && onRunPredictions && (
              <p className="text-xs text-white/60">
                Válassz ki legalább egy mérkőzést az elemzéshez
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};