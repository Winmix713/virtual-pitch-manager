export { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export type Match = Database['public']['Tables']['matches']['Row']

export type MatchFilters = {
  home_team?: string
  away_team?: string
  btts_computed?: boolean
  comeback_computed?: boolean
  result_computed?: string
  date_from?: string
  date_to?: string
}

export type MatchStats = {
  total_matches: number
  home_wins: number
  draws: number
  away_wins: number
  btts_count: number
  comeback_count: number
  avg_goals: number
  home_avg_goals: number
  away_avg_goals: number
  home_win_percentage: number
  draw_percentage: number
  away_win_percentage: number
  btts_percentage: number
  comeback_percentage: number
  most_frequent_results: Array<{ score: string; count: number; percentage: number }>
  halftime_transformations: number
  prediction_quality?: {
    home_qualified: boolean
    away_qualified: boolean
    draw_highlighted: boolean
    btts_qualified: boolean
    confidence_level: number
    recommendation: string
    confidence: string
  }
}

export type OptimizedDisplayCriteria = {
  showHomeStats: boolean
  showAwayStats: boolean
  showDrawStats: boolean
  showBttsStats: boolean
  highlightDraws: boolean
}