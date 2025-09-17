import { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  MessageSquare,
  Users,
  Lightbulb,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { leadStorage } from '@/utils/leadStorage';
import { aiStorage } from '@/utils/aiStorage';
import type {
  Lead,
  AIAnalysis,
  ConversionPrediction,
  AIRecommendation,
  DuplicateDetection,
  ChatbotConfig
} from '@/types/lead';

const AIAnalytics = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<Record<string, AIAnalysis>>({});
  const [predictions, setPredictions] = useState<Record<string, ConversionPrediction>>({});
  const [duplicates, setDuplicates] = useState<DuplicateDetection[]>([]);
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allLeads = leadStorage.getLeads();
    setLeads(allLeads);

    // Load AI analyses for all leads
    const analyses: Record<string, AIAnalysis> = {};
    const conversionPredictions: Record<string, ConversionPrediction> = {};

    allLeads.forEach(lead => {
      const analysis = aiStorage.getAIAnalysis(lead.id);
      const prediction = aiStorage.getConversionPrediction(lead.id);

      if (analysis) analyses[lead.id] = analysis;
      if (prediction) conversionPredictions[lead.id] = prediction;
    });

    setAiAnalyses(analyses);
    setPredictions(conversionPredictions);

    // Load duplicate detections
    setDuplicates(aiStorage.getAllDuplicateDetections());

    // Load chatbot configuration
    setChatbotConfig(aiStorage.getChatbotConfig());
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analyses: Record<string, AIAnalysis> = {};
      const conversionPredictions: Record<string, ConversionPrediction> = {};

      for (const lead of leads) {
        // Run sentiment analysis
        const analysis = aiStorage.analyzeLeadSentiment(lead);
        analyses[lead.id] = analysis;

        // Run conversion prediction
        const prediction = aiStorage.predictConversion(lead);
        conversionPredictions[lead.id] = prediction;

        // Check for duplicates
        aiStorage.detectDuplicates(lead, leads);
      }

      setAiAnalyses(analyses);
      setPredictions(conversionPredictions);
      setDuplicates(aiStorage.getAllDuplicateDetections());

      toast({
        title: 'Análise IA Concluída',
        description: `Analisados ${leads.length} leads com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro na Análise',
        description: 'Erro ao executar análise de IA',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAIOverviewStats = () => {
    const totalAnalyzed = Object.keys(aiAnalyses).length;
    const positiveSentiment = Object.values(aiAnalyses).filter(a => a.sentiment === 'positive').length;
    const negativeSentiment = Object.values(aiAnalyses).filter(a => a.sentiment === 'negative').length;
    const highConfidence = Object.values(predictions).filter(p => p.confidence > 80).length;
    const criticalUrgency = Object.values(aiAnalyses).filter(a => a.urgencyLevel === 'critical').length;
    const pendingDuplicates = duplicates.filter(d => d.status === 'pending').length;

    return {
      totalAnalyzed,
      positiveSentiment,
      negativeSentiment,
      highConfidence,
      criticalUrgency,
      pendingDuplicates
    };
  };

  const getAllRecommendations = (): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];
    Object.values(aiAnalyses).forEach(analysis => {
      recommendations.push(...analysis.recommendedActions);
    });
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  };

  const handleRecommendationImplemented = (recommendationId: string) => {
    // Update recommendation as implemented
    toast({
      title: 'Recomendação Implementada',
      description: 'A recomendação foi marcada como implementada',
    });
  };

  const updateChatbotConfig = (updates: Partial<ChatbotConfig>) => {
    if (!chatbotConfig) return;

    const updatedConfig = { ...chatbotConfig, ...updates };
    setChatbotConfig(updatedConfig);
    aiStorage.updateChatbotConfig(updatedConfig);

    toast({
      title: 'Configuração Atualizada',
      description: 'Configurações do chatbot foram salvas',
    });
  };

  const renderSentimentBadge = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const config = {
      positive: { color: 'bg-green-500', text: 'Positivo' },
      neutral: { color: 'bg-gray-500', text: 'Neutro' },
      negative: { color: 'bg-red-500', text: 'Negativo' }
    };

    return (
      <Badge className={`${config[sentiment].color} text-white`}>
        {config[sentiment].text}
      </Badge>
    );
  };

  const renderUrgencyBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
    const config = {
      low: { color: 'bg-blue-500', text: 'Baixa' },
      medium: { color: 'bg-yellow-500', text: 'Média' },
      high: { color: 'bg-orange-500', text: 'Alta' },
      critical: { color: 'bg-red-500', text: 'Crítica' }
    };

    return (
      <Badge className={`${config[level].color} text-white`}>
        {config[level].text}
      </Badge>
    );
  };

  const stats = getAIOverviewStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            IA & Análises Preditivas
          </h2>
          <p className="text-muted-foreground">
            Inteligência artificial para otimização de conversões
          </p>
        </div>
        <Button onClick={runAIAnalysis} disabled={isAnalyzing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analisando...' : 'Executar Análise'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalAnalyzed}</div>
                <div className="text-xs text-muted-foreground">Leads Analisados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.positiveSentiment}</div>
                <div className="text-xs text-muted-foreground">Sentimento Positivo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.highConfidence}</div>
                <div className="text-xs text-muted-foreground">Alta Confiança</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.criticalUrgency}</div>
                <div className="text-xs text-muted-foreground">Urgência Crítica</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.pendingDuplicates}</div>
                <div className="text-xs text-muted-foreground">Duplicatas Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{chatbotConfig?.isEnabled ? 'ON' : 'OFF'}</div>
                <div className="text-xs text-muted-foreground">Chatbot Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sentiment">Análise de Sentimento</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicatas</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Positivo</span>
                    <span className="font-bold text-green-600">{stats.positiveSentiment}</span>
                  </div>
                  <Progress value={(stats.positiveSentiment / stats.totalAnalyzed) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span>Neutro</span>
                    <span className="font-bold text-gray-600">
                      {stats.totalAnalyzed - stats.positiveSentiment - stats.negativeSentiment}
                    </span>
                  </div>
                  <Progress
                    value={((stats.totalAnalyzed - stats.positiveSentiment - stats.negativeSentiment) / stats.totalAnalyzed) * 100}
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span>Negativo</span>
                    <span className="font-bold text-red-600">{stats.negativeSentiment}</span>
                  </div>
                  <Progress value={(stats.negativeSentiment / stats.totalAnalyzed) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Principais Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAllRecommendations().slice(0, 5).map((rec, index) => (
                    <div key={rec.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                        <Badge variant="outline" className="mt-1">
                          {rec.confidence}% confiança
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecommendationImplemented(rec.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Sentimento por Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Sentimento</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Urgência</TableHead>
                    <TableHead>Tópicos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(aiAnalyses).map(([leadId, analysis]) => {
                    const lead = leads.find(l => l.id === leadId);
                    if (!lead) return null;

                    return (
                      <TableRow key={leadId}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          {renderSentimentBadge(analysis.sentiment)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{analysis.sentimentScore.toFixed(2)}</span>
                            <Progress
                              value={((analysis.sentimentScore + 1) / 2) * 100}
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{analysis.confidenceScore}%</TableCell>
                        <TableCell>
                          {renderUrgencyBadge(analysis.urgencyLevel)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {analysis.keyTopics.slice(0, 2).map(topic => (
                              <Badge key={topic} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Análise Detalhada - {lead.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Sentimento</label>
                                    <div className="mt-1">
                                      {renderSentimentBadge(analysis.sentiment)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Score</label>
                                    <div className="mt-1 text-lg font-bold">
                                      {analysis.sentimentScore.toFixed(3)}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Tópicos Identificados</label>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {analysis.keyTopics.map(topic => (
                                      <Badge key={topic} variant="outline">{topic}</Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Recomendações</label>
                                  <div className="mt-1 space-y-2">
                                    {analysis.recommendedActions.map(rec => (
                                      <div key={rec.id} className="p-3 bg-muted rounded-lg">
                                        <div className="font-medium">{rec.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {rec.description}
                                        </div>
                                        <div className="mt-2">
                                          <Badge variant="outline">
                                            {rec.confidence}% confiança
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previsões de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Fatores Positivos</TableHead>
                    <TableHead>Fatores Negativos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(predictions).map(([leadId, prediction]) => {
                    const lead = leads.find(l => l.id === leadId);
                    if (!lead) return null;

                    const positiveFactors = prediction.factors.filter(f => f.impact === 'positive');
                    const negativeFactors = prediction.factors.filter(f => f.impact === 'negative');

                    return (
                      <TableRow key={leadId}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">{prediction.probability.toFixed(1)}%</span>
                            <Progress value={prediction.probability} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>{prediction.confidence}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{prediction.estimatedTimeToConversion} dias</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {positiveFactors.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {negativeFactors.length}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAllRecommendations().map(rec => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.description}
                        </p>
                        <div className="text-sm">
                          <strong>Ação Sugerida:</strong> {rec.suggestedAction}
                        </div>
                        <div className="text-sm">
                          <strong>Impacto Esperado:</strong> {rec.expectedImpact}
                        </div>
                        <div className="mt-2">
                          <Progress value={rec.confidence} className="h-2 w-32" />
                          <span className="text-xs text-muted-foreground">
                            {rec.confidence}% confiança
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecommendationImplemented(rec.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detecção de Duplicatas</CardTitle>
            </CardHeader>
            <CardContent>
              {duplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma duplicata detectada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicates.map(duplicate => (
                    <div key={duplicate.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">Possível Duplicata Detectada</h4>
                          <p className="text-sm text-muted-foreground">
                            Confiança: {duplicate.confidence.toFixed(1)}%
                          </p>
                        </div>
                        <Badge variant={duplicate.status === 'pending' ? 'secondary' : 'outline'}>
                          {duplicate.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {duplicate.potentialDuplicates.map(match => (
                          <div key={match.leadId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <span className="font-medium">
                                {leads.find(l => l.id === match.leadId)?.name || 'Lead não encontrado'}
                              </span>
                              <div className="text-sm text-muted-foreground">
                                Similaridade: {(match.similarity * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Campos: {match.matchingFields.join(', ')}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {match.suggestedAction}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot Tab */}
        <TabsContent value="chatbot" className="space-y-4">
          {chatbotConfig && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Chatbot Ativo</label>
                    <Switch
                      checked={chatbotConfig.isEnabled}
                      onCheckedChange={(checked) => updateChatbotConfig({ isEnabled: checked })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                    <Textarea
                      value={chatbotConfig.welcomeMessage}
                      onChange={(e) => updateChatbotConfig({ welcomeMessage: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mensagem de Fallback</label>
                    <Textarea
                      value={chatbotConfig.fallbackMessage}
                      onChange={(e) => updateChatbotConfig({ fallbackMessage: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Perguntas de Qualificação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chatbotConfig.qualificationQuestions.map((question, index) => (
                      <div key={question.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Pergunta {index + 1}</span>
                          <Badge variant={question.isRequired ? 'destructive' : 'secondary'}>
                            {question.isRequired ? 'Obrigatória' : 'Opcional'}
                          </Badge>
                        </div>
                        <p className="text-sm">{question.question}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Tipo: {question.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Horário de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {Object.entries(chatbotConfig.businessHours).map(([day, hours]) => {
                      if (day === 'timezone') return null;

                      return (
                        <div key={day} className="space-y-2">
                          <div className="font-medium capitalize">{day}</div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={hours.isOpen}
                              onCheckedChange={(checked) => {
                                const newHours = {
                                  ...chatbotConfig.businessHours,
                                  [day]: { ...hours, isOpen: checked }
                                };
                                updateChatbotConfig({ businessHours: newHours });
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {hours.isOpen ? `${hours.start} - ${hours.end}` : 'Fechado'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalytics;