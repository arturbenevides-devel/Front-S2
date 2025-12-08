import { AgentStats, AGENT_LEVELS } from '@/types/gamification';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp } from 'lucide-react';

interface AgentProfileProps {
  agent: AgentStats;
  compact?: boolean;
}

export function AgentProfile({ agent, compact = false }: AgentProfileProps) {
  const currentLevel = agent.level;
  const nextLevel = AGENT_LEVELS.find(l => l.level === currentLevel.level + 1);
  
  const xpInCurrentLevel = agent.xp - currentLevel.minXP;
  const xpNeededForLevel = (nextLevel?.minXP || currentLevel.maxXP) - currentLevel.minXP;
  const progress = nextLevel ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
            {currentLevel.icon}
          </div>
          {agent.streak > 0 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center">
              <Flame className="w-3 h-3 text-warning-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{agent.name}</span>
            <Badge variant="secondary" className="text-xs">
              Nv. {currentLevel.level}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {agent.xp} XP
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar & Level */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl shadow-lg">
              {currentLevel.icon}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-card border border-border shadow-md">
              <span className="text-xs font-bold text-foreground">Nv. {currentLevel.level}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">{agent.name}</h3>
            <p className="text-sm text-primary font-medium">{currentLevel.name}</p>
            
            {/* Streak */}
            {agent.streak > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">{agent.streak} dias de streak</span>
              </div>
            )}

            {/* XP Progress */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-foreground">
                  {agent.xp} / {nextLevel?.minXP || '∞'} XP
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
              {nextLevel && (
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {nextLevel.minXP - agent.xp} XP para {nextLevel.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.salesCount}</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.conversationsToday}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.avgResponseTime}m</p>
            <p className="text-xs text-muted-foreground">Resposta</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{agent.nps}</p>
            <p className="text-xs text-muted-foreground">NPS</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
