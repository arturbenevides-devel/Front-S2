import { Badge as BadgeType } from '@/types/gamification';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface AchievementToastProps {
  badge: BadgeType | null;
  onDismiss: () => void;
}

export function useAchievementToast() {
  const { toast } = useToast();

  const showAchievement = (badge: BadgeType) => {
    toast({
      title: `🎉 Nova Conquista Desbloqueada!`,
      description: (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
            {badge.icon}
          </div>
          <div>
            <p className="font-semibold text-foreground">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          </div>
        </div>
      ),
      className: 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30',
      duration: 5000,
    });
  };

  const showXPGain = (amount: number, reason: string) => {
    toast({
      title: `⚡ +${amount} XP`,
      description: reason,
      className: 'bg-success/10 border-success/30',
      duration: 3000,
    });
  };

  const showLevelUp = (newLevel: { name: string; icon: string; level: number }) => {
    toast({
      title: `🎊 Subiu de Nível!`,
      description: (
        <div className="flex items-center gap-3 mt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning/20 to-accent/20 flex items-center justify-center text-3xl animate-bounce">
            {newLevel.icon}
          </div>
          <div>
            <p className="font-bold text-lg text-foreground">Nível {newLevel.level}</p>
            <p className="text-sm text-muted-foreground">{newLevel.name}</p>
          </div>
        </div>
      ),
      className: 'bg-gradient-to-r from-warning/10 to-primary/10 border-warning/30',
      duration: 6000,
    });
  };

  const showStreakMilestone = (days: number) => {
    toast({
      title: `🔥 Streak de ${days} dias!`,
      description: 'Continue assim para desbloquear badges especiais!',
      className: 'bg-warning/10 border-warning/30',
      duration: 4000,
    });
  };

  return { showAchievement, showXPGain, showLevelUp, showStreakMilestone };
}

export function AchievementToast({ badge, onDismiss }: AchievementToastProps) {
  const { showAchievement } = useAchievementToast();

  useEffect(() => {
    if (badge) {
      showAchievement(badge);
      onDismiss();
    }
  }, [badge, onDismiss, showAchievement]);

  return null;
}
