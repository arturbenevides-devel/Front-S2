import type { AuthUser } from '@/contexts/AuthContext';
import { AgentStats, DailyChallenge, LeaderboardEntry, AGENT_LEVELS, AVAILABLE_BADGES } from '@/types/gamification';

const emptyAgentStats = (id: string, name: string, avatar?: string): AgentStats => ({
  id,
  name,
  avatar,
  xp: 0,
  level: AGENT_LEVELS[0],
  streak: 0,
  badges: [],
  salesCount: 0,
  conversationsToday: 0,
  avgResponseTime: 0,
  nps: 0,
  weeklyXP: 0,
  monthlyXP: 0,
});

/** Nome/foto do usuário autenticado; demais campos são placeholders até existir backend de gamificação. */
export function buildGamificationAgentStats(user: AuthUser | null): AgentStats {
  if (!user) {
    return emptyAgentStats('guest', 'Convidado');
  }
  return emptyAgentStats(user.id, user.fullName, user.profileImage);
}

const getLevel = (xp: number) => {
  return AGENT_LEVELS.find(l => xp >= l.minXP && xp < l.maxXP) || AGENT_LEVELS[0];
};

export const mockAgentStats: AgentStats[] = [
  {
    id: 'agent-1',
    name: 'Agente (demo)',
    xp: 720,
    level: getLevel(720),
    streak: 12,
    badges: [
      { ...AVAILABLE_BADGES[0], unlockedAt: new Date('2024-01-15') },
      { ...AVAILABLE_BADGES[2], unlockedAt: new Date('2024-01-20') },
      { ...AVAILABLE_BADGES[4], unlockedAt: new Date('2024-02-01') },
      { ...AVAILABLE_BADGES[6], unlockedAt: new Date('2024-02-10') },
    ],
    salesCount: 28,
    conversationsToday: 15,
    avgResponseTime: 2.3,
    nps: 4.8,
    weeklyXP: 180,
    monthlyXP: 720,
  },
  {
    id: 'agent-2',
    name: 'Maria Santos',
    xp: 540,
    level: getLevel(540),
    streak: 8,
    badges: [
      { ...AVAILABLE_BADGES[0], unlockedAt: new Date('2024-01-18') },
      { ...AVAILABLE_BADGES[2], unlockedAt: new Date('2024-01-25') },
      { ...AVAILABLE_BADGES[5], unlockedAt: new Date('2024-02-05') },
    ],
    salesCount: 22,
    conversationsToday: 12,
    avgResponseTime: 2.8,
    nps: 4.6,
    weeklyXP: 150,
    monthlyXP: 540,
  },
  {
    id: 'agent-3',
    name: 'João Costa',
    xp: 890,
    level: getLevel(890),
    streak: 18,
    badges: [
      { ...AVAILABLE_BADGES[0], unlockedAt: new Date('2024-01-10') },
      { ...AVAILABLE_BADGES[1], unlockedAt: new Date('2024-01-28') },
      { ...AVAILABLE_BADGES[2], unlockedAt: new Date('2024-01-15') },
      { ...AVAILABLE_BADGES[3], unlockedAt: new Date('2024-02-08') },
      { ...AVAILABLE_BADGES[4], unlockedAt: new Date('2024-01-22') },
      { ...AVAILABLE_BADGES[6], unlockedAt: new Date('2024-02-01') },
      { ...AVAILABLE_BADGES[8], unlockedAt: new Date('2024-02-15') },
    ],
    salesCount: 45,
    conversationsToday: 18,
    avgResponseTime: 1.8,
    nps: 4.9,
    weeklyXP: 220,
    monthlyXP: 890,
  },
  {
    id: 'agent-4',
    name: 'Ana Lima',
    xp: 320,
    level: getLevel(320),
    streak: 5,
    badges: [
      { ...AVAILABLE_BADGES[0], unlockedAt: new Date('2024-02-01') },
      { ...AVAILABLE_BADGES[4], unlockedAt: new Date('2024-02-10') },
    ],
    salesCount: 12,
    conversationsToday: 8,
    avgResponseTime: 3.2,
    nps: 4.5,
    weeklyXP: 90,
    monthlyXP: 320,
  },
  {
    id: 'agent-5',
    name: 'Pedro Mendes',
    xp: 480,
    level: getLevel(480),
    streak: 3,
    badges: [
      { ...AVAILABLE_BADGES[2], unlockedAt: new Date('2024-01-30') },
      { ...AVAILABLE_BADGES[5], unlockedAt: new Date('2024-02-12') },
    ],
    salesCount: 18,
    conversationsToday: 10,
    avgResponseTime: 2.5,
    nps: 4.7,
    weeklyXP: 120,
    monthlyXP: 480,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = mockAgentStats
  .sort((a, b) => b.xp - a.xp)
  .map((agent, index) => ({
    rank: index + 1,
    agent,
    change: index === 0 ? 'same' : index === 1 ? 'up' : index === 2 ? 'down' : 'same',
    previousRank: index === 1 ? 3 : index === 2 ? 2 : index + 1,
  }));

export const mockDailyChallenges: DailyChallenge[] = [
  {
    id: 'challenge-1',
    title: 'Responda 10 leads',
    description: 'Responda a 10 leads hoje',
    target: 10,
    current: 7,
    xpReward: 30,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    completed: false,
  },
  {
    id: 'challenge-2',
    title: 'Velocidade máxima',
    description: 'Responda 5 leads em menos de 3 minutos',
    target: 5,
    current: 3,
    xpReward: 40,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    completed: false,
  },
  {
    id: 'challenge-3',
    title: 'Feche uma venda',
    description: 'Complete uma venda hoje',
    target: 1,
    current: 1,
    xpReward: 50,
    expiresAt: new Date(new Date().setHours(23, 59, 59, 999)),
    completed: true,
  },
];
