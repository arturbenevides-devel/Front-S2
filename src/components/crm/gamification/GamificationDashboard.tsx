import { useState } from 'react';
import { AgentProfile } from './AgentProfile';
import { Leaderboard } from './Leaderboard';
import { BadgesDisplay } from './BadgesDisplay';
import { DailyChallenges } from './DailyChallenges';
import { useAchievementToast } from './AchievementToast';
import { currentAgent, mockLeaderboard, mockDailyChallenges } from '@/data/gamificationData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gamepad2, 
  TrendingUp, 
  Zap, 
  Trophy,
  Target,
  Award,
  Flame,
  ArrowRight
} from 'lucide-react';

export function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { showXPGain, showLevelUp, showStreakMilestone } = useAchievementToast();

  // Demo function to show notifications
  const demoXPGain = () => {
    showXPGain(50, 'Venda fechada com sucesso!');
  };

  const totalXPToday = Math.floor(currentAgent.weeklyXP / 7);
  const completedChallenges = mockDailyChallenges.filter(c => c.completed).length;

  return (
    <div className="flex-1 overflow-auto bg-background p-6 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Gamepad2 className="w-7 h-7 text-primary" />
              Gamificação
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 py-1.5 px-3">
              <Flame className="w-4 h-4 text-warning" />
              <span className="font-bold">{currentAgent.streak} dias</span>
            </Badge>
            <Badge variant="secondary" className="gap-2 py-1.5 px-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-bold">+{totalXPToday} XP hoje</span>
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Target className="w-4 h-4" />
              Desafios
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="w-4 h-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Profile Card */}
            <AgentProfile agent={currentAgent} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-card to-warning/5 border-warning/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Posição no Ranking</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        #{mockLeaderboard.find(e => e.agent.id === currentAgent.id)?.rank || '-'}
                      </p>
                    </div>
                    <Trophy className="w-10 h-10 text-warning/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Desafios Completos</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {completedChallenges}/{mockDailyChallenges.length}
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-primary/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Badges Conquistados</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {currentAgent.badges.length}
                      </p>
                    </div>
                    <Award className="w-10 h-10 text-accent/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Challenges Preview */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Desafios do Dia
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab('challenges')}
                      className="gap-1"
                    >
                      Ver todos
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DailyChallenges challenges={mockDailyChallenges} compact />
                </CardContent>
              </Card>

              {/* Badges Preview */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Award className="w-5 h-5 text-accent" />
                      Suas Conquistas
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab('badges')}
                      className="gap-1"
                    >
                      Ver todas
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BadgesDisplay unlockedBadges={currentAgent.badges} showLocked={false} compact />
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Preview */}
            <Leaderboard entries={mockLeaderboard.slice(0, 5)} currentAgentId={currentAgent.id} />
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="mt-6">
            <Leaderboard entries={mockLeaderboard} currentAgentId={currentAgent.id} />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="mt-6">
            <DailyChallenges challenges={mockDailyChallenges} />
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-6">
            <BadgesDisplay unlockedBadges={currentAgent.badges} showLocked />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
