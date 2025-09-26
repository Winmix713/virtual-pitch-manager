import React, { useState, useCallback, useEffect, Suspense, lazy } from "react";
import { RotateCcw, Filter, Download, Brain, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";

// Komponens importok
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import DashboardCustomizer from "@/components/DashboardCustomizer";
import PredictionModal from "@/components/PredictionModal";
import { DashboardContainer, DashboardItem } from "@/components/DashboardContainer";
import { useToast } from "@/hooks/use-toast";
import { useMatches } from "@/hooks/use-matches";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import type { MatchFilters } from "@/lib/supabase";

// Lazy-loaded komponensek
const FilterSection = lazy(() => import("@/components/FilterSection"));
const OptimizedStatisticsCards = lazy(() => import("@/components/OptimizedStatisticsCards"));
const ProbabilitySection = lazy(() => import("@/components/ProbabilitySection"));
const EnhancedChartSection = lazy(() => import("@/components/EnhancedChartSection"));
const ResultsTable = lazy(() => import("@/components/ResultsTable"));

// Típusdefiníciók
type QuickAction = "Visszaállítás" | "Szűrés" | "CSV export" | "Predikció készítése";

// Segédfüggvények
/**
 * Robusztus CSV tartalmat generál egy mérkőzéslistából.
 */
const generateCsvContent = (matches: any[]): string => {
  const escapeCsvField = (field: string | number | null | undefined): string => {
    const str = String(field ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = ['Hazai csapat', 'Vendég csapat', 'Félidő', 'Végeredmény', 'BTTS', 'Fordítás', 'Idő'];
  const rows = matches.map(match =>
    [
      escapeCsvField(match.home_team),
      escapeCsvField(match.away_team),
      escapeCsvField(
        match.half_time_home_goals !== null && match.half_time_away_goals !== null
          ? `${match.half_time_home_goals}-${match.half_time_away_goals}`
          : 'N/A'
      ),
      escapeCsvField(`${match.full_time_home_goals}-${match.full_time_away_goals}`),
      escapeCsvField(match.btts_computed ? 'Igen' : 'Nem'),
      escapeCsvField(match.comeback_computed ? 'Igen' : 'Nem'),
      escapeCsvField(match.match_time),
    ].join(',')
  );

  return `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
};

interface HeroSectionProps {
  loading: boolean;
  hasMatches: boolean;
  onQuickAction: (action: QuickAction) => void;
}

/**
 * Az oldal fő "hero" szekcióját jeleníti meg címmel, leírással és gyorsművelet gombokkal.
 */
const HeroSection = React.memo(({ loading, hasMatches, onQuickAction }: HeroSectionProps) => (
  <section className="text-center space-y-4 winmix-fade-in">
    <h1 className="winmix-hero">
      Mérkőzés szűrő és statisztikák
    </h1>
    <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
      Szűrd a meccseket csapatokra és eseményekre, elemezd a kimeneteleket, és exportáld CSV-be a professzionális WinMix platformon.
    </p>
    
    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
      <Button 
        variant="outline" 
        onClick={() => onQuickAction("Visszaállítás")}
        className="winmix-btn-glass winmix-hover-lift winmix-focus"
        aria-label="Szűrők visszaállítása"
        disabled={loading}
      >
        <RotateCcw className="size-4 mr-2" />
        Visszaállítás
      </Button>
      <Button 
        onClick={() => onQuickAction("Szűrés")}
        className="winmix-btn-primary winmix-hover-lift winmix-focus"
        aria-label="Szűrők alkalmazása"
        disabled={loading}
      >
        <Filter className="size-4 mr-2" />
        Szűrés
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onQuickAction("CSV export")}
        className="winmix-btn-glass winmix-hover-lift winmix-focus"
        aria-label="Adatok exportálása CSV formátumban"
        disabled={loading || !hasMatches}
      >
        <Download className="size-4 mr-2" />
        CSV export
      </Button>
      <Button 
        onClick={() => onQuickAction("Predikció készítése")}
        className="winmix-btn-primary winmix-hover-lift winmix-focus"
        aria-label="Predikció készítése 8 mérkőzésre"
        disabled={loading}
      >
        <Brain className="size-4 mr-2" />
        Predikció készítése
      </Button>
      <DashboardCustomizer />
    </div>
  </section>
));
HeroSection.displayName = "HeroSection";

/**
 * A főoldal konténer komponense, amely menedzseli az állapotokat,
 * adatlekérést és a különböző alkomponensek interakcióit.
 */
const Index = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<MatchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  
  const { matches, stats, totalCount, totalPages, loading, error, refetch } = useMatches(filters, currentPage, 50);
  const { visibleWidgets } = useDashboardLayout();

  // Egységesített hibakezelés
  useEffect(() => {
    if (error) {
      toast({
        title: "Hiba történt",
        description: `Hiba a mérkőzések lekérése közben: ${error}`,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  /**
   * Kezeli a gyorsművelet gombok kattintásait.
   */
  const handleQuickAction = useCallback((action: QuickAction) => {
    switch (action) {
      case "Visszaállítás":
        setFilters({});
        setCurrentPage(1);
        toast({ 
          title: "Szűrők visszaállítva", 
          description: "Minden szűrési feltétel törölve." 
        });
        break;

      case "Szűrés":
        setCurrentPage(1);
        refetch();
        toast({ 
          title: "Szűrők alkalmazva", 
          description: "Az eredmények frissültek a megadott feltételek alapján." 
        });
        break;

      case "CSV export":
        if (matches.length === 0) {
          toast({ 
            title: "Nincs adat", 
            description: "Nincs exportálható mérkőzés a jelenlegi szűrés mellett.", 
            variant: "destructive" 
          });
          return;
        }
        try {
          const csvContent = generateCsvContent(matches);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          saveAs(blob, 'merkozesek.csv');
          toast({ 
            title: "CSV export sikeres", 
            description: `${matches.length} mérkőzés exportálva.` 
          });
        } catch (exportError) {
          toast({ 
            title: "Export hiba", 
            description: "Hiba történt a CSV fájl generálása közben.", 
            variant: "destructive" 
          });
        }
        break;

      case "Predikció készítése":
        setPredictionModalOpen(true);
        break;
    }
  }, [matches, refetch, toast]);

  /**
   * Callback a szűrők állapotának frissítésére.
   */
  const handleFiltersChange = useCallback((newFilters: MatchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const renderWidget = useCallback((widget: { id: string, component: string }) => {
    const componentMap: { [key: string]: React.ReactNode } = {
      'StatisticsCards': <OptimizedStatisticsCards stats={stats} loading={loading} />,
      'ProbabilitySection': <ProbabilitySection stats={stats} loading={loading} />,
      'EnhancedChartSection': <EnhancedChartSection filters={filters} />,
      'ResultsTable': (
        <ResultsTable 
          matches={matches} 
          loading={loading} 
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      ),
    };
    
    const ComponentToRender = componentMap[widget.component];
    return ComponentToRender ? (
      <DashboardItem key={widget.id} id={widget.id}>
        {ComponentToRender}
      </DashboardItem>
    ) : null;
  }, [stats, loading, filters, matches, totalCount, totalPages, currentPage]);
  
  // Lazy-loaded komponensek fallback UI-ja
  const renderSuspenseFallback = () => (
    <div className="flex justify-center items-center min-h-[200px] w-full bg-background/50 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen w-full relative bg-black text-foreground smooth-scroll">
      {/* Violet Storm Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.25), transparent 70%), #000000",
        }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12 relative z-10">
        <HeroSection 
          loading={loading} 
          hasMatches={totalCount > 0} 
          onQuickAction={handleQuickAction} 
        />
        
        <Suspense fallback={renderSuspenseFallback()}>
          <div className="space-y-12">
            <FilterSection filters={filters} onFiltersChange={handleFiltersChange} />
            
            <DashboardContainer>
              {visibleWidgets.map(renderWidget)}
            </DashboardContainer>
          </div>
        </Suspense>
        
        <PredictionModal 
          open={predictionModalOpen} 
          onOpenChange={setPredictionModalOpen} 
        />
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-border bg-background/50 backdrop-blur-sm relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">W</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2024 WinMix. Minden jog fenntartva.
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              Magyar sports analytics platform
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;