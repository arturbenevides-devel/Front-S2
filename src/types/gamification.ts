export interface AgentLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
}

export const AGENT_LEVELS: AgentLevel[] = [
  { level: 1, name: 'Iniciante', minXP: 0, maxXP: 100, icon: '🌱' },
  { level: 2, name: 'Agente', minXP: 100, maxXP: 300, icon: '⭐' },
  { level: 3, name: 'Sênior', minXP: 300, maxXP: 600, icon: '🏅' },
  { level: 4, name: 'Especialista', minXP: 600, maxXP: 1000, icon: '💎' },
  { level: 5, name: 'Master', minXP: 1000, maxXP: Infinity, icon: '👑' },
];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'sales' | 'satisfaction' | 'streak' | 'special';
  requirement: number;
  unlockedAt?: Date;
}

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'velocista', name: 'Velocista', description: 'Responda 10 leads em menos de 5 minutos', icon: '🚀', category: 'speed', requirement: 10 },
  { id: 'velocista-pro', name: 'Velocista Pro', description: 'Responda 50 leads em menos de 5 minutos', icon: '⚡', category: 'speed', requirement: 50 },
  { id: 'closer', name: 'Closer', description: 'Feche 5 vendas', icon: '💰', category: 'sales', requirement: 5 },
  { id: 'closer-elite', name: 'Closer Elite', description: 'Feche 25 vendas', icon: '💎', category: 'sales', requirement: 25 },
  { id: 'favorito', name: 'Favorito', description: 'Mantenha NPS acima de 4.5', icon: '⭐', category: 'satisfaction', requirement: 1 },
  { id: 'globetrotter', name: 'Globetrotter', description: 'Venda para 5 destinos diferentes', icon: '🌍', category: 'special', requirement: 5 },
  { id: 'maratonista', name: 'Maratonista', description: 'Mantenha streak de 7 dias', icon: '🔥', category: 'streak', requirement: 7 },
  { id: 'lendario', name: 'Lendário', description: 'Mantenha streak de 30 dias', icon: '🏆', category: 'streak', requirement: 30 },
  { id: 'campeao', name: 'Campeão do Mês', description: 'Lidere o ranking mensal', icon: '🥇', category: 'special', requirement: 1 },
  { id: 'mentor', name: 'Mentor', description: 'Ajude 10 colegas em atendimentos', icon: '🤝', category: 'special', requirement: 10 },
];

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  expiresAt: Date;
  completed: boolean;
}

export interface AgentStats {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: AgentLevel;
  streak: number;
  badges: Badge[];
  salesCount: number;
  conversationsToday: number;
  avgResponseTime: number;
  nps: number;
  weeklyXP: number;
  monthlyXP: number;
}

export interface LeaderboardEntry {
  rank: number;
  agent: AgentStats;
  change: 'up' | 'down' | 'same';
  previousRank?: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';
export type LeaderboardMetric = 'xp' | 'sales' | 'responseTime' | 'nps';

export interface XPEvent {
  id: string;
  type: 'fast_response' | 'sale' | 'high_rating' | 'challenge_complete' | 'streak_bonus';
  xp: number;
  description: string;
  timestamp: Date;
}

export const XP_VALUES = {
  fast_response: 10,
  sale: 50,
  high_rating: 20,
  challenge_complete: 30,
  streak_bonus: 15,
};
