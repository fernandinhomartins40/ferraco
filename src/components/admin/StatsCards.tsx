import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Clock, CheckCircle } from 'lucide-react';
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
      color: 'default',
    },
    {
      title: 'Novos',
      value: stats.novo,
      icon: UserPlus,
      color: 'default',
    },
    {
      title: 'Em Andamento',
      value: stats.em_andamento,
      icon: Clock,
      color: 'secondary',
    },
    {
      title: 'Concluídos',
      value: stats.concluido,
      icon: CheckCircle,
      color: 'default',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{card.value}</div>
                <Badge variant={card.color} className="ml-2">
                  {stats.total > 0 ? Math.round((card.value / stats.total) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;