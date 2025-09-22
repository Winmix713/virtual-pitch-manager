import { TrendingUp, TrendingDown, Minus, Trophy, Target, BarChart3, AlertTriangle } from "lucide-react";
import NumberCounter from "./NumberCounter";
import { MatchStats, OptimizedDisplayCriteria } from "@/lib/supabase";
import LoadingSpinner from "./LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OptimizedStatisticsCardsProps {
  stats: MatchStats | null;
  loading: boolean;
}

const OptimizedStatisticsCards = ({ stats, loading }: OptimizedStatisticsCardsProps) => {
  if (loading) {
    return (
      <section className="space-y-6 winmix-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="winmix-section-title">Optimalizált prediktív elemzés</h2>
          <LoadingSpinner size="sm" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="winmix-stat-card rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 bg-white/10 rounded-lg"></div>
                <div className="text-right">
                  <div className="w-12 h-4 bg-white/10 rounded mb-1"></div>
                  <div className="w-16 h-2 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-32 h-5 bg-white/10 rounded"></div>
                <div className="w-20 h-8 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="space-y-6 winmix-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="winmix-section-title">Optimalizált prediktív elemzés</h2>
          <span className="text-sm text-muted-foreground">Nincs adat</span>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nincs megjeleníthető statisztika a jelenlegi szűrők alapján.</p>
        </div>
      </section>
    );
  }

  // Calculate display criteria based on thresholds
  const criteria: OptimizedDisplayCriteria = {
    showHomeStats: stats.home_win_percentage >= 65,
    showAwayStats: stats.away_win_percentage >= 65,
    showDrawStats: true, // Always show but highlight if over 30%
    showBttsStats: stats.btts_percentage >= 55,
    highlightDraws: stats.draw_percentage > 30
  };

  const qualifyingStatsConfig = [];

  // Only show stats that meet criteria
  if (criteria.showHomeStats) {
    qualifyingStatsConfig.push({
      title: "Hazai győzelem",
      value: stats.home_wins,
      percentage: stats.home_win_percentage,
      color: "success",
      icon: TrendingUp,
      gradient: "from-success/20 via-success/10 to-transparent",
      ringColor: "success",
      iconBg: "success/20",
      borderColor: "success/30",
      glowColor: "success/40",
      isQualified: true,
      avgGoals: stats.home_avg_goals,
      suffix: "%",
      decimal: 1
    });
  }

  if (criteria.showAwayStats) {
    qualifyingStatsConfig.push({
      title: "Vendég győzelem",
      value: stats.away_wins,
      percentage: stats.away_win_percentage,
      color: "info",
      icon: TrendingDown,
      gradient: "from-info/20 via-info/10 to-transparent",
      ringColor: "info",
      iconBg: "info/20",
      borderColor: "info/30",
      glowColor: "info/40",
      isQualified: true,
      avgGoals: stats.away_avg_goals,
      suffix: "%",
      decimal: 1
    });
  }

  if (criteria.showDrawStats) {
    qualifyingStatsConfig.push({
      title: "Döntetlen",
      value: stats.draws,
      percentage: stats.draw_percentage,
      color: criteria.highlightDraws ? "destructive" : "warning",
      icon: Minus,
      gradient: criteria.highlightDraws 
        ? "from-destructive/20 via-destructive/10 to-transparent" 
        : "from-warning/20 via-warning/10 to-transparent",
      ringColor: criteria.highlightDraws ? "destructive" : "warning",
      iconBg: criteria.highlightDraws ? "destructive/20" : "warning/20",
      borderColor: criteria.highlightDraws ? "destructive/30" : "warning/30",
      glowColor: criteria.highlightDraws ? "destructive/40" : "warning/40",
      isQualified: true,
      isHighlighted: criteria.highlightDraws,
      suffix: "%",
      decimal: 1
    });
  }

  if (criteria.showBttsStats) {
    qualifyingStatsConfig.push({
      title: "BTTS arány",
      value: stats.btts_percentage,
      percentage: stats.btts_percentage,
      color: "chart-2",
      icon: Target,
      gradient: "from-chart-2/20 via-chart-2/10 to-transparent",
      ringColor: "chart-2",
      iconBg: "chart-2/20",
      borderColor: "chart-2/30",
      glowColor: "chart-2/40",
      isQualified: true,
      suffix: "%",
      decimal: 1
    });
  }

  // Always show total matches and average goals
  qualifyingStatsConfig.push({
    title: "Összesen meccs",
    value: stats.total_matches,
    percentage: 100,
    color: "winmix-violet",
    icon: Trophy,
    gradient: "from-winmix-violet/20 via-winmix-violet/10 to-transparent",
    ringColor: "winmix-violet",
    iconBg: "winmix-violet/20",
    borderColor: "winmix-violet/30",
    glowColor: "winmix-violet/40",
    isQualified: true
  });

  qualifyingStatsConfig.push({
    title: "Átlag gólok",
    value: stats.avg_goals,
    percentage: Math.min((stats.avg_goals / 5) * 100, 100),
    color: "chart-5",
    icon: BarChart3,
    gradient: "from-chart-5/20 via-chart-5/10 to-transparent",
    ringColor: "chart-5",
    iconBg: "chart-5/20",
    borderColor: "chart-5/30",
    glowColor: "chart-5/40",
    isQualified: true,
    decimal: 1
  });

  return (
    <section className="space-y-6 winmix-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="winmix-section-title">Optimalizált prediktív elemzés</h2>
        <span className="text-sm text-muted-foreground">
          {stats.total_matches} mérkőzés | {qualifyingStatsConfig.length - 2} kritérium teljesült
        </span>
      </div>

      {/* Criteria Alert */}
      <Alert className="bg-white/5 border-white/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Megjelenítési kritériumok:</strong> Hazai/Vendég győzelem ≥65% • Döntetlen kiemelve &gt;30% • BTTS ≥55%
        </AlertDescription>
      </Alert>

      {/* Most Frequent Results */}
      {stats.most_frequent_results.length > 0 && (
        <div className="winmix-stat-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Leggyakoribb eredmények</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.most_frequent_results.map((result, index) => (
              <div key={result.score} className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-xl font-bold text-primary">{result.score}</div>
                <div className="text-xs text-muted-foreground">{result.count}x ({result.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Halftime Transformations */}
      <div className="winmix-stat-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Félidő-végeredmény átalakulások</h3>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-chart-3">
            <NumberCounter value={stats.halftime_transformations} duration={1500} />
          </div>
          <div className="text-sm text-muted-foreground">
            mérkőzés ({Number(((stats.halftime_transformations / stats.total_matches) * 100).toFixed(1))}%)
          </div>
        </div>
      </div>

      {/* Qualifying Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {qualifyingStatsConfig.map((stat, index) => {
          const Icon = stat.icon;
          const getHoverClass = () => {
            if (stat.title.includes("Hazai")) return "hazai-hover";
            if (stat.title.includes("Döntetlen")) return "dontetlen-hover";
            if (stat.title.includes("Vendég")) return "vendeg-hover";
            return "";
          };

          return (
            <div
              key={stat.title}
              className={`winmix-stat-card rounded-xl p-6 group ${getHoverClass()} winmix-slide-up ${
                stat.isHighlighted ? 'ring-2 ring-destructive/50' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Qualification Badge */}
              {stat.isQualified && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full animate-pulse"></div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.iconBg} ring-1 ring-${stat.borderColor} group-hover:ring-2 transition-all duration-300`}>
                  <Icon className={`size-5 text-${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">
                    {stat.percentage}%
                  </div>
                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${stat.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="winmix-card-title text-foreground group-hover:text-white transition-colors stat-content">
                  {stat.title}
                  {stat.isHighlighted && (
                    <span className="ml-2 text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                      KIEMELVE
                    </span>
                  )}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground group-hover:text-white transition-colors stat-number">
                    <NumberCounter 
                      value={stat.value} 
                      duration={1500} 
                      decimal={stat.decimal}
                    />
                    {stat.suffix && <span className="text-xl">{stat.suffix}</span>}
                  </span>
                </div>
                {stat.avgGoals && (
                  <div className="text-xs text-muted-foreground">
                    Átlag gólok: {stat.avgGoals}
                  </div>
                )}
              </div>

              {/* Background Gradient */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OptimizedStatisticsCards;