import { Badge as BadgeType, AVAILABLE_BADGES } from '@/types/gamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgesDisplayProps {
  unlockedBadges: BadgeType[];
  showLocked?: boolean;
  compact?: boolean;
}

export function BadgesDisplay({ unlockedBadges, showLocked = true, compact = false }: BadgesDisplayProps) {
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));
  
  const allBadges = showLocked 
    ? AVAILABLE_BADGES.map(badge => ({
        ...badge,
        unlocked: unlockedIds.has(badge.id),
        unlockedAt: unlockedBadges.find(b => b.id === badge.id)?.unlockedAt,
      }))
    : unlockedBadges.map(badge => ({ ...badge, unlocked: true }));

  const getCategoryColor = (category: BadgeType['category']) => {
    switch (category) {
      case 'speed':
        return 'bg-info/10 border-info/30 text-info';
      case 'sales':
        return 'bg-success/10 border-success/30 text-success';
      case 'satisfaction':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'streak':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'special':
        return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  const getCategoryLabel = (category: BadgeType['category']) => {
    switch (category) {
      case 'speed': return 'Velocidade';
      case 'sales': return 'Vendas';
      case 'satisfaction': return 'Satisfação';
      case 'streak': return 'Sequência';
      case 'special': return 'Especial';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1.5">
          {unlockedBadges.slice(0, 6).map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg cursor-pointer hover:scale-110 transition-transform">
                  {badge.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {unlockedBadges.length > 6 && (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{unlockedBadges.length - 6}
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Conquistas
          <Badge variant="secondary" className="ml-2">
            {unlockedBadges.length}/{AVAILABLE_BADGES.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allBadges.map((badge) => (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer',
                      badge.unlocked
                        ? `${getCategoryColor(badge.category)} hover:scale-105`
                        : 'bg-muted/30 border-border opacity-50'
                    )}
                  >
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-3xl">{badge.icon}</span>
                    <span className="text-xs font-medium text-center line-clamp-1">
                      {badge.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]">
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  {badge.unlocked && badge.unlockedAt && (
                    <p className="text-xs text-success mt-2">
                      ✓ Desbloqueado em {new Date(badge.unlockedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {getCategoryLabel(badge.category)}
                  </Badge>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
