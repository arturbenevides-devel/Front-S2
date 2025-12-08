import { DailyChallenge } from '@/types/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  compact?: boolean;
}

export function DailyChallenges({ challenges, compact = false }: DailyChallengesProps) {
  const completedCount = challenges.filter(c => c.completed).length;
  
  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {challenges.slice(0, 2).map((challenge) => (
          <div
            key={challenge.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-all',
              challenge.completed
                ? 'bg-success/10 border-success/30'
                : 'bg-card border-border'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              challenge.completed ? 'bg-success' : 'bg-primary/10'
            )}>
              {challenge.completed ? (
                <CheckCircle2 className="w-4 h-4 text-success-foreground" />
              ) : (
                <Target className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {challenge.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={(challenge.current / challenge.target) * 100} 
                  className="h-1.5 flex-1" 
                />
                <span className="text-xs text-muted-foreground">
                  {challenge.current}/{challenge.target}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs gap-1">
              <Zap className="w-3 h-3" />
              {challenge.xpReward}
            </Badge>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Desafios do Dia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Clock className="w-3 h-3" />
              {getTimeRemaining(challenges[0]?.expiresAt || new Date())}
            </Badge>
            <Badge variant="secondary">
              {completedCount}/{challenges.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={cn(
              'relative overflow-hidden rounded-xl border p-4 transition-all',
              challenge.completed
                ? 'bg-success/10 border-success/30'
                : 'bg-gradient-to-r from-card to-primary/5 border-border hover:border-primary/30'
            )}
          >
            {challenge.completed && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                challenge.completed ? 'bg-success' : 'bg-primary/10'
              )}>
                {challenge.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success-foreground" />
                ) : (
                  <Target className="w-5 h-5 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn(
                    'font-medium',
                    challenge.completed ? 'text-success line-through' : 'text-foreground'
                  )}>
                    {challenge.title}
                  </h4>
                  <Badge 
                    variant={challenge.completed ? 'default' : 'secondary'}
                    className="gap-1 shrink-0"
                  >
                    <Zap className="w-3 h-3" />
                    +{challenge.xpReward} XP
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {challenge.description}
                </p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={cn(
                      'font-medium',
                      challenge.completed ? 'text-success' : 'text-foreground'
                    )}>
                      {challenge.current}/{challenge.target}
                    </span>
                  </div>
                  <Progress 
                    value={(challenge.current / challenge.target) * 100} 
                    className={cn('h-2', challenge.completed && '[&>div]:bg-success')}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
