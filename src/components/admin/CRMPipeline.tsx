import { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  BarChart3,
  Filter,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Star,
  Zap,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { leadStorage } from '@/utils/leadStorage';
import { crmStorage } from '@/utils/crmStorage';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type {
  Lead,
  Pipeline,
  PipelineStage,
  Opportunity,
  Interaction,
  LeadScoring
} from '@/types/lead';

const CRMPipeline = () => {
  const { toast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadScoring, setLeadScoring] = useState<Record<string, LeadScoring>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpportunityOpen, setIsCreateOpportunityOpen] = useState(false);
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    value: 0,
    expectedCloseDate: '',
    stage: ''
  });
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    description: '',
    businessType: '',
    stages: [] as Omit<PipelineStage, 'id'>[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allPipelines = crmStorage.getPipelines();
    const allOpportunities = crmStorage.getOpportunities();
    const allInteractions = crmStorage.getInteractions();
    const allLeads = leadStorage.getLeads();

    setPipelines(allPipelines);
    setActivePipeline(allPipelines.find(p => p.isDefault) || allPipelines[0] || null);
    setOpportunities(allOpportunities);
    setInteractions(allInteractions);
    setLeads(allLeads);

    // Load lead scoring for all leads
    const scoring: Record<string, LeadScoring> = {};
    allLeads.forEach(lead => {
      const leadScore = crmStorage.getLeadScoring(lead.id);
      if (leadScore) {
        scoring[lead.id] = leadScore;
      }
    });
    setLeadScoring(scoring);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !activePipeline) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const leadId = draggableId.replace('lead-', '');
    const fromStage = source.droppableId;
    const toStage = destination.droppableId;

    // Update lead pipeline stage
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex >= 0) {
      const updatedLeads = [...leads];
      updatedLeads[leadIndex] = {
        ...updatedLeads[leadIndex],
        pipelineStage: toStage
      };
      setLeads(updatedLeads);

      // Update in storage
      leadStorage.updateLead(leadId, { pipelineStage: toStage });

      // Track the movement
      crmStorage.moveLeadBetweenStages(leadId, fromStage, toStage);

      toast({
        title: 'Lead Movimentado',
        description: `Lead movido para ${getStageById(toStage)?.name || 'novo estágio'}`,
      });
    }
  };

  const getStageById = (stageId: string): PipelineStage | undefined => {
    return activePipeline?.stages.find(s => s.id === stageId);
  };

  const getLeadsByStage = (stageId: string): Lead[] => {
    return leads.filter(lead => lead.pipelineStage === stageId);
  };

  const getOpportunitiesByStage = (stageId: string): Opportunity[] => {
    return opportunities.filter(opp => opp.stage === stageId);
  };

  const getTotalValueByStage = (stageId: string): number => {
    return getOpportunitiesByStage(stageId).reduce((sum, opp) => sum + opp.value, 0);
  };

  const getWeightedValueByStage = (stageId: string): number => {
    return getOpportunitiesByStage(stageId).reduce((sum, opp) => {
      return sum + (opp.value * (opp.probability / 100));
    }, 0);
  };

  const createOpportunity = () => {
    if (!selectedLead || !newOpportunity.title) return;

    try {
      crmStorage.createOpportunity(
        selectedLead.id,
        newOpportunity.title,
        newOpportunity.description,
        newOpportunity.value,
        newOpportunity.expectedCloseDate,
        newOpportunity.stage
      );

      setIsCreateOpportunityOpen(false);
      setNewOpportunity({
        title: '',
        description: '',
        value: 0,
        expectedCloseDate: '',
        stage: ''
      });
      loadData();

      toast({
        title: 'Oportunidade Criada',
        description: 'Nova oportunidade criada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar oportunidade',
        variant: 'destructive',
      });
    }
  };

  const createPipeline = () => {
    if (!newPipeline.name || newPipeline.stages.length === 0) return;

    try {
      crmStorage.createPipeline(
        newPipeline.name,
        newPipeline.description,
        newPipeline.businessType,
        newPipeline.stages
      );

      setIsCreatePipelineOpen(false);
      setNewPipeline({
        name: '',
        description: '',
        businessType: '',
        stages: []
      });
      loadData();

      toast({
        title: 'Pipeline Criado',
        description: 'Novo pipeline criado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar pipeline',
        variant: 'destructive',
      });
    }
  };

  const addInteraction = (leadId: string, type: Interaction['type']) => {
    const interaction = {
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`,
      description: 'Interação adicionada via pipeline',
      outcome: 'successful' as const,
      participants: [],
      createdBy: 'current_user'
    };

    crmStorage.addInteraction(leadId, interaction);
    loadData();

    toast({
      title: 'Interação Adicionada',
      description: `${type} registrado com sucesso`,
    });
  };

  const calculateLeadScore = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    try {
      const scoring = crmStorage.calculateLeadScore(lead);
      setLeadScoring(prev => ({ ...prev, [leadId]: scoring }));

      toast({
        title: 'Score Calculado',
        description: `Score do lead: ${scoring.score}/100`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao calcular score do lead',
        variant: 'destructive',
      });
    }
  };

  const renderLeadCard = (lead: Lead, index: number) => {
    const leadScore = leadScoring[lead.id];
    const leadOpportunities = opportunities.filter(opp =>
      interactions.some(int => int.participants.includes(lead.id))
    );
    const totalValue = leadOpportunities.reduce((sum, opp) => sum + opp.value, 0);

    return (
      <Draggable key={lead.id} draggableId={`lead-${lead.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-3 cursor-move transition-all ${
              snapshot.isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">{lead.name}</h4>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </div>
              <div className="flex items-center space-x-1">
                {leadScore && (
                  <Badge variant="outline" className="text-xs">
                    Score: {leadScore.score}
                  </Badge>
                )}
                {lead.priority === 'high' && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
              </div>
            </div>

            {totalValue > 0 && (
              <div className="mb-2">
                <div className="text-xs text-muted-foreground">
                  Valor: R$ {totalValue.toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              {lead.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {new Date(lead.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    addInteraction(lead.id, 'call');
                  }}
                >
                  <Phone className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    addInteraction(lead.id, 'whatsapp');
                  }}
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLead(lead);
                    setIsCreateOpportunityOpen(true);
                  }}
                >
                  <DollarSign className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    calculateLeadScore(lead.id);
                  }}
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderStageColumn = (stage: PipelineStage) => {
    const stageLeads = getLeadsByStage(stage.id);
    const stageOpportunities = getOpportunitiesByStage(stage.id);
    const totalValue = getTotalValueByStage(stage.id);
    const weightedValue = getWeightedValueByStage(stage.id);

    return (
      <div key={stage.id} className="flex-1 min-w-80 max-w-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <h3 className="font-medium">{stage.name}</h3>
              <Badge variant="outline">{stageLeads.length}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {stage.conversionRate * 100}%
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-1">
            {stage.description}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Valor Total:</span>
              <div className="font-medium">R$ {totalValue.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Ponderado:</span>
              <div className="font-medium">R$ {weightedValue.toLocaleString()}</div>
            </div>
          </div>

          <Progress
            value={(stageLeads.length / Math.max(leads.length, 1)) * 100}
            className="h-1 mt-2"
          />
        </div>

        <Droppable droppableId={stage.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[400px] p-2 rounded-lg transition-colors ${
                snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
              }`}
            >
              {stageLeads.map((lead, index) => renderLeadCard(lead, index))}
              {provided.placeholder}

              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum lead neste estágio</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  if (!activePipeline) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum Pipeline Configurado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro pipeline para começar a gerenciar leads
          </p>
          <Button onClick={() => setIsCreatePipelineOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Pipeline
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            CRM Pipeline
          </h2>
          <p className="text-muted-foreground">
            Funil visual de vendas com gestão de oportunidades
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCreatePipelineOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pipeline
          </Button>
          <Button onClick={loadData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Pipeline Selector */}
      <div className="flex items-center space-x-4">
        <Select
          value={activePipeline.id}
          onValueChange={(value) => {
            const pipeline = pipelines.find(p => p.id === value);
            setActivePipeline(pipeline || null);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map(pipeline => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline">{activePipeline.businessType}</Badge>

        {activePipeline.isDefault && (
          <Badge variant="secondary">Padrão</Badge>
        )}
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{leads.length}</div>
                <div className="text-xs text-muted-foreground">Total de Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {crmStorage.getTotalPipelineValue().toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Valor Total Pipeline</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {crmStorage.getWeightedPipelineValue().toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Valor Ponderado</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {activePipeline.stages.reduce((sum, s) => sum + s.expectedDuration, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Dias Médios Ciclo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas - {activePipeline.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {activePipeline.stages.map(stage => renderStageColumn(stage))}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Create Opportunity Dialog */}
      <Dialog open={isCreateOpportunityOpen} onOpenChange={setIsCreateOpportunityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Oportunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newOpportunity.title}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                placeholder="Ex: Proposta estrutura metálica"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newOpportunity.description}
                onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                placeholder="Descreva a oportunidade..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  value={newOpportunity.value}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, value: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Data Esperada</label>
                <Input
                  type="date"
                  value={newOpportunity.expectedCloseDate}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Estágio</label>
              <Select
                value={newOpportunity.stage}
                onValueChange={(value) => setNewOpportunity({ ...newOpportunity, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {activePipeline.stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateOpportunityOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createOpportunity}>
                Criar Oportunidade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Pipeline Dialog */}
      <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newPipeline.name}
                  onChange={(e) => setNewPipeline({ ...newPipeline, name: e.target.value })}
                  placeholder="Ex: Vendas B2B"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Negócio</label>
                <Input
                  value={newPipeline.businessType}
                  onChange={(e) => setNewPipeline({ ...newPipeline, businessType: e.target.value })}
                  placeholder="Ex: estruturas_metalicas"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newPipeline.description}
                onChange={(e) => setNewPipeline({ ...newPipeline, description: e.target.value })}
                placeholder="Descreva o pipeline..."
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Estágios</label>
                <Button
                  size="sm"
                  onClick={() => {
                    const newStage = {
                      name: `Estágio ${newPipeline.stages.length + 1}`,
                      description: '',
                      color: '#3b82f6',
                      order: newPipeline.stages.length,
                      automations: [],
                      expectedDuration: 7,
                      conversionRate: 0.5,
                      isClosedWon: false,
                      isClosedLost: false
                    };
                    setNewPipeline({
                      ...newPipeline,
                      stages: [...newPipeline.stages, newStage]
                    });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newPipeline.stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <Input
                      value={stage.name}
                      onChange={(e) => {
                        const updatedStages = [...newPipeline.stages];
                        updatedStages[index] = { ...stage, name: e.target.value };
                        setNewPipeline({ ...newPipeline, stages: updatedStages });
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const updatedStages = newPipeline.stages.filter((_, i) => i !== index);
                        setNewPipeline({ ...newPipeline, stages: updatedStages });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreatePipelineOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createPipeline}>
                Criar Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMPipeline;