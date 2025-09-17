import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Clock, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import { LeadStats } from '@/types/lead';

interface StatsCardsProps {
  stats: LeadStats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total de Leads',
      value: stats.total,
      icon: Users,
      color: 'default' as const,
      description: 'Total geral',
    },
    {
      title: 'Taxa de Conversão',
      value: `${stats.conversionRate}%`,
      icon: stats.conversionRate >= 20 ? TrendingUp : TrendingDown,
      color: stats.conversionRate >= 20 ? 'default' : 'secondary' as const,
      description: 'Conversão leads → concluídos',
      trend: stats.conversionRate >= 20 ? 'up' : 'down',
    },
    {
      title: 'Tempo Médio',
      value: `${stats.averageConversionTime}d`,
      icon: Clock,
      color: 'default' as const,
      description: 'Dias para conversão',
    },
    {
      title: 'Hoje',
      value: stats.todayLeads,
      icon: Calendar,
      color: 'default' as const,
      description: 'Leads de hoje',
    },
    {
      title: 'Novos',
      value: stats.novo,
      icon: UserPlus,
      color: 'default' as const,
      description: 'Aguardando contato',
    },
    {
      title: 'Em Andamento',
      value: stats.em_andamento,
      icon: Clock,
      color: 'secondary' as const,
      description: 'Em negociação',
    },
    {
      title: 'Concluídos',
      value: stats.concluido,
      icon: CheckCircle,
      color: 'default' as const,
      description: 'Vendas fechadas',
    },
    {
      title: 'Leads Antigos',
      value: stats.oldLeadsCount,
      icon: AlertTriangle,
      color: stats.oldLeadsCount > 0 ? 'destructive' : 'default' as const,
      description: 'Precisam atenção',
      alert: stats.oldLeadsCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              card.alert ? 'animate-pulse border-destructive' : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon
                className={`h-4 w-4 transition-colors ${
                  card.trend === 'up' ? 'text-green-500' :
                  card.trend === 'down' ? 'text-red-500' :
                  card.alert ? 'text-destructive' : 'text-muted-foreground'
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {card.description}
                </div>
                {card.title === 'Taxa de Conversão' && stats.weeklyGrowth !== 0 && (
                  <div className={`text-xs flex items-center space-x-1 ${
                    stats.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.weeklyGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(stats.weeklyGrowth)}% esta semana</span>
                  </div>
                )}
              </div>
            </CardContent>
            {card.alert && (
              <div className="absolute top-2 right-2">
                <div className="h-2 w-2 bg-destructive rounded-full animate-ping"></div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;