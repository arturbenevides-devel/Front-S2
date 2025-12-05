import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MessageSquare, 
  Users, 
  CheckCircle,
  Calendar,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data para métricas
const weeklyConversations = [
  { day: 'Seg', conversas: 45, resolvidas: 38 },
  { day: 'Ter', conversas: 52, resolvidas: 45 },
  { day: 'Qua', conversas: 38, resolvidas: 35 },
  { day: 'Qui', conversas: 65, resolvidas: 58 },
  { day: 'Sex', conversas: 72, resolvidas: 64 },
  { day: 'Sáb', conversas: 28, resolvidas: 25 },
  { day: 'Dom', conversas: 15, resolvidas: 14 },
];

const monthlyVolume = [
  { month: 'Jan', volume: 420 },
  { month: 'Fev', volume: 380 },
  { month: 'Mar', volume: 510 },
  { month: 'Abr', volume: 470 },
  { month: 'Mai', volume: 590 },
  { month: 'Jun', volume: 640 },
];

const responseTimeData = [
  { hora: '08h', tempo: 2.5 },
  { hora: '10h', tempo: 3.2 },
  { hora: '12h', tempo: 4.1 },
  { hora: '14h', tempo: 2.8 },
  { hora: '16h', tempo: 3.5 },
  { hora: '18h', tempo: 2.1 },
];

const conversionByCategory = [
  { name: 'Leads', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Reservas', value: 30, color: 'hsl(var(--accent))' },
  { name: 'Suporte', value: 15, color: 'hsl(var(--info))' },
  { name: 'Follow-up', value: 10, color: 'hsl(var(--warning))' },
];

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon, subtitle }: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="bg-card border-border hover:shadow-medium transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-3 rounded-xl bg-primary/10">
              {icon}
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium ${
                isPositive 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isPositive ? '+' : ''}{change}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard() {
  return (
    <div className="flex-1 overflow-auto bg-background p-6 scrollbar-thin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard de Métricas</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho do atendimento</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Últimos 7 dias
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Tempo Médio de Resposta"
            value="2.8 min"
            change={-12}
            icon={<Clock className="w-5 h-5 text-primary" />}
            subtitle="Meta: < 5 min"
          />
          <MetricCard
            title="Conversas Hoje"
            value={72}
            change={18}
            icon={<MessageSquare className="w-5 h-5 text-primary" />}
            subtitle="64 resolvidas"
          />
          <MetricCard
            title="Taxa de Conversão"
            value="32%"
            change={5}
            icon={<Target className="w-5 h-5 text-primary" />}
            subtitle="Leads → Vendas"
          />
          <MetricCard
            title="Clientes Ativos"
            value={156}
            change={8}
            icon={<Users className="w-5 h-5 text-primary" />}
            subtitle="Últimos 30 dias"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume de Conversas */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Volume de Conversas (Semana)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyConversations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar 
                      dataKey="conversas" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Total"
                    />
                    <Bar 
                      dataKey="resolvidas" 
                      fill="hsl(var(--success))" 
                      radius={[4, 4, 0, 0]}
                      name="Resolvidas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tempo de Resposta */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Tempo de Resposta por Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="hora" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      unit=" min"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`${value} min`, 'Tempo']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tempo" 
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tendência Mensal */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Tendência de Volume (6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Categoria */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Conversas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversionByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {conversionByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {conversionByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-3xl font-bold text-success">89%</p>
                <p className="text-sm text-muted-foreground mt-1">Taxa de Resolução</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-3xl font-bold text-primary">4.8</p>
                <p className="text-sm text-muted-foreground mt-1">Satisfação (NPS)</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-3xl font-bold text-accent">R$ 45.2k</p>
                <p className="text-sm text-muted-foreground mt-1">Vendas do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
