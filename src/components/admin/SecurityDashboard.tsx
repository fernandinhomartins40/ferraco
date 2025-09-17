import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Users, Activity, Clock, Eye, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';
import PermissionGate from '@/components/PermissionGate';

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  activeUsers: number;
  criticalEvents: number;
  lastLogin: string;
  securityScore: number;
}

const SecurityDashboard = () => {
  const { user } = useAuth();
  const securityLogger = useSecurityLogger();
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLogins: 0,
    failedLogins: 0,
    activeUsers: 0,
    criticalEvents: 0,
    lastLogin: '',
    securityScore: 85
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = () => {
    setLoading(true);

    // Definir range de tempo
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 24 * 60 * 60 * 1000;

    // Obter logs do período
    const logs = securityLogger.getLogs({
      fromTime: Date.now() - timeRangeMs
    });

    // Calcular métricas
    const summary = securityLogger.getSecuritySummary(timeRangeMs);
    const recentLoginLogs = logs.filter(log =>
      log.eventType === SecurityEventType.LOGIN_SUCCESS ||
      log.eventType === SecurityEventType.LOGIN_FAILED
    ).slice(0, 10);

    setMetrics({
      totalLogins: summary.byType[SecurityEventType.LOGIN_SUCCESS] || 0,
      failedLogins: summary.failedLogins,
      activeUsers: 3, // Mock - seria obtido do backend
      criticalEvents: summary.criticalEvents,
      lastLogin: recentLoginLogs[0]?.timestamp ? new Date(recentLoginLogs[0].timestamp).toLocaleString('pt-BR') : 'N/A',
      securityScore: calculateSecurityScore(summary)
    });

    setRecentLogs(logs.slice(0, 15));
    setLoading(false);

    // Log access to security dashboard
    securityLogger.logEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      SecurityLevel.HIGH,
      'Acesso ao dashboard de segurança',
      { timeRange, logCount: logs.length },
      user?.id,
      user?.username,
      user?.role
    );
  };

  const calculateSecurityScore = (summary: any): number => {
    let score = 100;

    // Reduzir score baseado em eventos críticos
    score -= summary.criticalEvents * 15;
    score -= summary.failedLogins * 5;
    score -= summary.accessDenials * 3;

    // Bonus por atividade normal
    if (summary.byType[SecurityEventType.LOGIN_SUCCESS] > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  };

  const getEventTypeDisplay = (eventType: string) => {
    const types = {
      [SecurityEventType.LOGIN_SUCCESS]: { label: 'Login Sucesso', color: 'bg-green-100 text-green-800' },
      [SecurityEventType.LOGIN_FAILED]: { label: 'Login Falhou', color: 'bg-red-100 text-red-800' },
      [SecurityEventType.LOGOUT]: { label: 'Logout', color: 'bg-blue-100 text-blue-800' },
      [SecurityEventType.ACCESS_DENIED]: { label: 'Acesso Negado', color: 'bg-red-100 text-red-800' },
      [SecurityEventType.USER_ACTION]: { label: 'Ação Usuário', color: 'bg-gray-100 text-gray-800' },
      [SecurityEventType.SENSITIVE_DATA_ACCESS]: { label: 'Dados Sensíveis', color: 'bg-yellow-100 text-yellow-800' },
      [SecurityEventType.ERROR_OCCURRED]: { label: 'Erro Sistema', color: 'bg-red-100 text-red-800' },
      [SecurityEventType.PAGE_LOAD]: { label: 'Carregamento', color: 'bg-gray-100 text-gray-800' },
    };
    return types[eventType] || { label: eventType, color: 'bg-gray-100 text-gray-800' };
  };

  const getLevelColor = (level: string) => {
    const colors = {
      [SecurityLevel.LOW]: 'text-green-600',
      [SecurityLevel.MEDIUM]: 'text-yellow-600',
      [SecurityLevel.HIGH]: 'text-orange-600',
      [SecurityLevel.CRITICAL]: 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
  };

  const exportLogs = () => {
    const logs = securityLogger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    securityLogger.logUserAction(
      'export',
      'security_logs',
      user?.id,
      user?.username,
      user?.role,
      { timeRange, filename: a.download }
    );
  };

  const clearLogs = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs de segurança? Esta ação não pode ser desfeita.')) {
      securityLogger.clearLogs();
      loadSecurityData();
    }
  };

  return (
    <PermissionGate
      permission="admin:read"
      showDeniedMessage
      deniedMessage="Apenas administradores podem acessar o dashboard de segurança."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportLogs}>
              <Eye className="w-4 h-4 mr-2" />
              Exportar Logs
            </Button>
          </div>
        </div>

        {/* Security Score Alert */}
        {metrics.securityScore < 70 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Score de segurança baixo ({metrics.securityScore}%).
              Revise os eventos críticos e implemente melhorias de segurança.
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Segurança</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{metrics.securityScore}%</div>
              <Progress value={metrics.securityScore} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.securityScore >= 90 ? 'Excelente' :
                 metrics.securityScore >= 70 ? 'Bom' :
                 metrics.securityScore >= 50 ? 'Regular' : 'Crítico'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins Realizados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === '1h' ? 'Na última hora' :
                 timeRange === '24h' ? 'Nas últimas 24h' :
                 timeRange === '7d' ? 'Nos últimos 7 dias' :
                 'Nos últimos 30 dias'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tentativas Falharam</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                Logins com falha
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Atividade do Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Usuários Ativos</span>
                <Badge variant="outline">{metrics.activeUsers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Último Login</span>
                <span className="text-sm text-muted-foreground">{metrics.lastLogin}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total de Eventos</span>
                <Badge variant="outline">{recentLogs.length}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Ações Administrativas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSecurityData}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Carregando...' : 'Atualizar Dados'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Limpar Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Eventos de Segurança Recentes</span>
            </CardTitle>
            <CardDescription>
              Últimos {recentLogs.length} eventos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => {
                  const eventDisplay = getEventTypeDisplay(log.eventType);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={eventDisplay.color}>
                          {eventDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={getLevelColor(log.level)}>
                        <span className="font-medium">{log.level}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.username || 'Anônimo'}</div>
                          {log.userRole && (
                            <div className="text-xs text-muted-foreground">{log.userRole}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.details && (
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {JSON.stringify(log.details, null, 0).substring(0, 50)}...
                          </code>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {recentLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento de segurança encontrado no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
};

export default SecurityDashboard;