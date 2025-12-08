import { useState } from 'react';
import { LeaderboardEntry, LeaderboardPeriod } from '@/types/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentAgentId?: string;
}

export function Leaderboard({ entries, currentAgentId }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-warning" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Medal className="w-5 h-5 text-accent" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getChangeIcon = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-3.5 h-3.5 text-success" />;
      case 'down':
        return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/30';
      case 2:
        return 'bg-gradient-to-r from-muted/50 to-muted/20 border-muted-foreground/20';
      case 3:
        return 'bg-gradient-to-r from-accent/20 to-accent/5 border-accent/30';
      default:
        return 'bg-card border-border';
    }
  };

  const getXPByPeriod = (entry: LeaderboardEntry) => {
    switch (period) {
      case 'daily':
        return Math.floor(entry.agent.weeklyXP / 7);
      case 'weekly':
        return entry.agent.weeklyXP;
      case 'monthly':
        return entry.agent.monthlyXP;
    }
  };

  const sortedEntries = [...entries].sort((a, b) => getXPByPeriod(b) - getXPByPeriod(a));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Ranking
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-2.5">Hoje</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2.5">Semana</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2.5">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedEntries.map((entry, index) => (
          <div
            key={entry.agent.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-all',
              getRankStyle(index + 1),
              entry.agent.id === currentAgentId && 'ring-2 ring-primary'
            )}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(index + 1)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg">
              {entry.agent.level.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium truncate",
                  entry.agent.id === currentAgentId ? "text-primary" : "text-foreground"
                )}>
                  {entry.agent.name}
                </span>
                {entry.agent.id === currentAgentId && (
                  <Badge variant="outline" className="text-xs py-0">Você</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Nv. {entry.agent.level.level}</span>
                <span>•</span>
                <span>{entry.agent.badges.length} badges</span>
              </div>
            </div>

            {/* XP & Change */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-bold text-foreground">{getXPByPeriod(entry)} XP</p>
                <div className="flex items-center justify-end gap-1">
                  {getChangeIcon(entry.change)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
