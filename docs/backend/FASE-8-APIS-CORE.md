# FASE 8 - IMPLEMENTAÇÃO DAS APIs CORE

## 📋 VISÃO GERAL

Esta fase implementa os módulos fundamentais do CRM:
- **Leads**: Gestão completa de leads
- **Leads Parciais**: Captura de formulários incompletos
- **Notas**: Sistema de anotações vinculadas a leads
- **Tags**: Sistema de categorização e automação

**Duração Estimada**: 2 semanas (8-10 dias úteis)

---

## 🎯 OBJETIVOS DA FASE

- ✅ Implementar CRUD completo para todas as entidades core
- ✅ Sistema de filtros avançados e paginação
- ✅ Detecção e merge de duplicatas
- ✅ Sistema de tags automáticas
- ✅ Validações com Zod sem usar `any`
- ✅ Testes unitários com 90% de coverage

---

## 📦 MÓDULO 1: LEADS

### 1.1 Endpoints (15 total)

```typescript
// CRUD Básico
GET    /api/leads                    // Listar com filtros e paginação
GET    /api/leads/:id                // Buscar por ID
POST   /api/leads                    // Criar novo lead
PUT    /api/leads/:id                // Atualizar lead
DELETE /api/leads/:id                // Deletar lead (soft delete)

// Filtros e Busca
GET    /api/leads/search             // Busca por texto
GET    /api/leads/filters            // Filtros avançados

// Estatísticas
GET    /api/leads/stats              // Estatísticas gerais
GET    /api/leads/stats/by-status    // Por status
GET    /api/leads/stats/by-source    // Por fonte

// Timeline e Histórico
GET    /api/leads/:id/timeline       // Timeline do lead
GET    /api/leads/:id/history        // Histórico de mudanças

// Duplicatas
GET    /api/leads/duplicates         // Detectar duplicatas
POST   /api/leads/merge              // Merge de leads

// Exportação
GET    /api/leads/export             // Exportar (CSV, Excel, JSON)
```

### 1.2 Tipos TypeScript

**leads.types.ts**:
```typescript
import { Lead, LeadStatus, LeadPriority } from '@prisma/client';

// DTOs
export interface CreateLeadDTO {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  source?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  assignedToId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateLeadDTO extends Partial<CreateLeadDTO> {
  id: string;
}

export interface LeadFiltersDTO {
  search?: string;
  status?: LeadStatus[];
  priority?: LeadPriority[];
  source?: string[];
  assignedToId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasEmail?: boolean;
  hasPhone?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export interface MergeLeadsDTO {
  primaryLeadId: string;
  duplicateLeadIds: string[];
  fieldsToKeep: {
    name?: 'primary' | 'duplicate';
    email?: 'primary' | 'duplicate';
    phone?: 'primary' | 'duplicate';
    company?: 'primary' | 'duplicate';
    // etc...
  };
}

// Response Types
export interface LeadResponse {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  source?: string;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}

export interface LeadStatsResponse {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byPriority: Record<LeadPriority, number>;
  bySource: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}

export interface DuplicateMatch {
  lead: LeadResponse;
  score: number;
  matches: {
    field: string;
    similarity: number;
  }[];
}
```

### 1.3 Validações Zod

**leads.validators.ts**:
```typescript
import { z } from 'zod';
import { LeadStatus, LeadPriority } from '@prisma/client';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const CreateLeadSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(phoneRegex, 'Telefone inválido (formato: +5511999999999)')
    .trim(),

  company: z.string()
    .max(100)
    .trim()
    .optional(),

  position: z.string()
    .max(100)
    .trim()
    .optional(),

  source: z.string()
    .max(50)
    .trim()
    .optional(),

  status: z.nativeEnum(LeadStatus).optional(),

  priority: z.nativeEnum(LeadPriority).optional(),

  assignedToId: z.string()
    .cuid('ID de usuário inválido')
    .optional(),

  customFields: z.record(z.unknown()).optional(),

  tags: z.array(z.string().cuid()).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const LeadFiltersSchema = z.object({
  search: z.string().trim().optional(),

  status: z.array(z.nativeEnum(LeadStatus)).optional(),

  priority: z.array(z.nativeEnum(LeadPriority)).optional(),

  source: z.array(z.string()).optional(),

  assignedToId: z.string().cuid().optional(),

  tags: z.array(z.string().cuid()).optional(),

  dateFrom: z.string().datetime().optional(),

  dateTo: z.string().datetime().optional(),

  hasEmail: z.boolean().optional(),

  hasPhone: z.boolean().optional(),

  page: z.number().int().positive().default(1),

  limit: z.number().int().positive().max(100).default(20),

  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'score']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const MergeLeadsSchema = z.object({
  primaryLeadId: z.string().cuid(),

  duplicateLeadIds: z.array(z.string().cuid())
    .min(1, 'Ao menos um lead duplicado deve ser fornecido'),

  fieldsToKeep: z.object({
    name: z.enum(['primary', 'duplicate']).optional(),
    email: z.enum(['primary', 'duplicate']).optional(),
    phone: z.enum(['primary', 'duplicate']).optional(),
    company: z.enum(['primary', 'duplicate']).optional(),
    position: z.enum(['primary', 'duplicate']).optional(),
  }),
});
```

### 1.4 Service Layer

**leads.service.ts**:
```typescript
import { PrismaClient, Lead, Prisma } from '@prisma/client';
import {
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadFiltersDTO,
  MergeLeadsDTO,
  LeadResponse,
  LeadStatsResponse,
  DuplicateMatch
} from './leads.types';
import { calculateLeadScore } from '../../utils/scoring';
import { detectDuplicates } from '../../utils/duplicates';

export class LeadsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateLeadDTO, userId: string): Promise<LeadResponse> {
    // Verificar duplicatas antes de criar
    const duplicates = await this.findDuplicates({
      phone: data.phone,
      email: data.email,
    });

    if (duplicates.length > 0) {
      throw new Error('Lead duplicado detectado');
    }

    // Calcular score inicial
    const score = calculateLeadScore(data);

    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        score,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        tags: data.tags ? {
          connect: data.tags.map(id => ({ id })),
        } : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return this.mapToResponse(lead);
  }

  async findAll(filters: LeadFiltersDTO): Promise<{
    data: LeadResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy,
        skip: (filters.page! - 1) * filters.limit!,
        take: filters.limit,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: data.map(lead => this.mapToResponse(lead)),
      total,
      page: filters.page!,
      limit: filters.limit!,
    };
  }

  async findById(id: string): Promise<LeadResponse | null> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return lead ? this.mapToResponse(lead) : null;
  }

  async update(id: string, data: UpdateLeadDTO): Promise<LeadResponse> {
    // Recalcular score se dados relevantes mudaram
    const score = data.email || data.phone || data.company
      ? calculateLeadScore(data as CreateLeadDTO)
      : undefined;

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...data,
        score,
        tags: data.tags ? {
          set: data.tags.map(id => ({ id })),
        } : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return this.mapToResponse(lead);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(): Promise<LeadStatsResponse> {
    const [total, byStatus, byPriority, avgScore] = await Promise.all([
      this.prisma.lead.count({ where: { deletedAt: null } }),

      this.prisma.lead.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),

      this.prisma.lead.groupBy({
        by: ['priority'],
        where: { deletedAt: null },
        _count: true,
      }),

      this.prisma.lead.aggregate({
        where: { deletedAt: null },
        _avg: { score: true },
      }),
    ]);

    // Agrupar por fonte
    const leadsBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { deletedAt: null },
      _count: true,
    });

    return {
      total,
      byStatus: Object.fromEntries(
        byStatus.map(s => [s.status, s._count])
      ) as Record<string, number>,
      byPriority: Object.fromEntries(
        byPriority.map(p => [p.priority, p._count])
      ) as Record<string, number>,
      bySource: Object.fromEntries(
        leadsBySource.map(s => [s.source || 'Desconhecido', s._count])
      ),
      averageScore: avgScore._avg.score || 0,
      conversionRate: 0, // Calcular baseado em oportunidades
    };
  }

  async findDuplicates(criteria: {
    phone?: string;
    email?: string;
  }): Promise<DuplicateMatch[]> {
    const leads = await this.prisma.lead.findMany({
      where: {
        deletedAt: null,
        OR: [
          criteria.phone ? { phone: criteria.phone } : {},
          criteria.email ? { email: criteria.email } : {},
        ],
      },
      include: {
        assignedTo: true,
        tags: true,
      },
    });

    return detectDuplicates(leads);
  }

  async merge(data: MergeLeadsDTO): Promise<LeadResponse> {
    const [primary, ...duplicates] = await Promise.all([
      this.prisma.lead.findUnique({
        where: { id: data.primaryLeadId },
      }),
      ...data.duplicateLeadIds.map(id =>
        this.prisma.lead.findUnique({ where: { id } })
      ),
    ]);

    if (!primary) throw new Error('Lead principal não encontrado');

    // Merge de dados baseado em fieldsToKeep
    const mergedData: Partial<Lead> = { ...primary };

    Object.entries(data.fieldsToKeep).forEach(([field, source]) => {
      if (source === 'duplicate' && duplicates[0]) {
        mergedData[field as keyof Lead] = duplicates[0][field as keyof Lead];
      }
    });

    // Atualizar lead principal
    const updated = await this.prisma.lead.update({
      where: { id: data.primaryLeadId },
      data: mergedData,
      include: {
        assignedTo: true,
        tags: true,
      },
    });

    // Soft delete dos duplicados
    await this.prisma.lead.updateMany({
      where: {
        id: { in: data.duplicateLeadIds },
      },
      data: { deletedAt: new Date() },
    });

    return this.mapToResponse(updated);
  }

  private buildWhereClause(filters: LeadFiltersDTO): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.source && filters.source.length > 0) {
      where.source = { in: filters.source };
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          id: { in: filters.tags },
        },
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.hasEmail !== undefined) {
      where.email = filters.hasEmail ? { not: null } : null;
    }

    if (filters.hasPhone !== undefined) {
      where.phone = filters.hasPhone ? { not: null } : null;
    }

    return where;
  }

  private buildOrderByClause(filters: LeadFiltersDTO): Prisma.LeadOrderByWithRelationInput {
    return {
      [filters.sortBy!]: filters.sortOrder,
    };
  }

  private mapToResponse(lead: any): LeadResponse {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.position,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      score: lead.score,
      assignedTo: lead.assignedTo,
      tags: lead.tags,
      customFields: lead.customFields as Record<string, unknown>,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lastContactedAt: lead.lastContactedAt,
    };
  }
}
```

### 1.5 Controller

**leads.controller.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  LeadFiltersSchema,
  MergeLeadsSchema
} from './leads.validators';

export class LeadsController {
  constructor(private service: LeadsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateLeadSchema.parse(req.body);
      const lead = await this.service.create(data, req.user!.id);

      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = LeadFiltersSchema.parse(req.query);
      const result = await this.service.findAll(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await this.service.findById(req.params.id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = UpdateLeadSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const lead = await this.service.update(data.id, data);

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  findDuplicates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const duplicates = await this.service.findDuplicates({
        phone: req.query.phone as string,
        email: req.query.email as string,
      });

      res.json({
        success: true,
        data: duplicates,
      });
    } catch (error) {
      next(error);
    }
  };

  merge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = MergeLeadsSchema.parse(req.body);
      const lead = await this.service.merge(data);

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 1.6 Routes

**leads.routes.ts**:
```typescript
import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

const router = Router();
const service = new LeadsService(prisma);
const controller = new LeadsController(service);

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD
router.post('/',
  requirePermission('leads', 'create'),
  controller.create
);

router.get('/',
  requirePermission('leads', 'read'),
  controller.findAll
);

router.get('/stats',
  requirePermission('leads', 'read'),
  controller.getStats
);

router.get('/duplicates',
  requirePermission('leads', 'read'),
  controller.findDuplicates
);

router.get('/:id',
  requirePermission('leads', 'read'),
  controller.findById
);

router.put('/:id',
  requirePermission('leads', 'update'),
  controller.update
);

router.delete('/:id',
  requirePermission('leads', 'delete'),
  controller.delete
);

router.post('/merge',
  requirePermission('leads', 'update'),
  controller.merge
);

export default router;
```

---

## 📦 MÓDULO 2: LEADS PARCIAIS

### 2.1 Endpoints (6 total)

```typescript
GET    /api/partial-leads                 // Listar
POST   /api/partial-leads                 // Criar
PUT    /api/partial-leads/:id             // Atualizar
POST   /api/partial-leads/:id/convert     // Converter para lead completo
POST   /api/partial-leads/:id/abandon     // Marcar como abandonado
DELETE /api/partial-leads/cleanup         // Limpar antigos
```

### 2.2 Service Layer

**partial-leads.service.ts**:
```typescript
import { PrismaClient, PartialLead } from '@prisma/client';

export interface CreatePartialLeadDTO {
  sessionId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  step: number;
  totalSteps: number;
  source?: string;
}

export class PartialLeadsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePartialLeadDTO): Promise<PartialLead> {
    return this.prisma.partialLead.create({
      data: {
        ...data,
        lastActivityAt: new Date(),
      },
    });
  }

  async findBySessionId(sessionId: string): Promise<PartialLead | null> {
    return this.prisma.partialLead.findUnique({
      where: { sessionId },
    });
  }

  async update(id: string, data: Partial<CreatePartialLeadDTO>): Promise<PartialLead> {
    return this.prisma.partialLead.update({
      where: { id },
      data: {
        ...data,
        lastActivityAt: new Date(),
      },
    });
  }

  async convertToLead(id: string, userId: string): Promise<string> {
    const partial = await this.prisma.partialLead.findUnique({
      where: { id },
    });

    if (!partial) throw new Error('Lead parcial não encontrado');

    // Criar lead completo
    const lead = await this.prisma.lead.create({
      data: {
        name: partial.name!,
        email: partial.email,
        phone: partial.phone!,
        company: partial.company,
        source: partial.source,
        status: 'NOVO',
        priority: 'MEDIUM',
        createdById: userId,
        assignedToId: userId,
      },
    });

    // Marcar parcial como convertido
    await this.prisma.partialLead.update({
      where: { id },
      data: {
        convertedToLeadId: lead.id,
        convertedAt: new Date(),
      },
    });

    return lead.id;
  }

  async markAbandoned(id: string): Promise<void> {
    await this.prisma.partialLead.update({
      where: { id },
      data: {
        isAbandoned: true,
        abandonedAt: new Date(),
      },
    });
  }

  async cleanup(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.partialLead.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        convertedToLeadId: null,
      },
    });

    return result.count;
  }
}
```

---

## 📦 MÓDULO 3: NOTAS

### 3.1 Endpoints (10 total)

```typescript
GET    /api/notes                      // Listar todas
GET    /api/notes/lead/:leadId         // Notas de um lead
POST   /api/notes                      // Criar nota
PUT    /api/notes/:id                  // Atualizar nota
DELETE /api/notes/:id                  // Deletar nota
PUT    /api/notes/:id/important        // Marcar como importante
POST   /api/notes/:id/duplicate        // Duplicar nota
GET    /api/notes/search               // Buscar notas
GET    /api/notes/categories           // Listar categorias
GET    /api/notes/important            // Listar notas importantes
```

### 3.2 Service Layer

**notes.service.ts**:
```typescript
import { PrismaClient, Note } from '@prisma/client';

export interface CreateNoteDTO {
  leadId: string;
  content: string;
  category?: string;
  isImportant?: boolean;
}

export class NotesService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateNoteDTO, userId: string): Promise<Note> {
    return this.prisma.note.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByLeadId(leadId: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, content: string): Promise<Note> {
    return this.prisma.note.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.note.delete({
      where: { id },
    });
  }

  async toggleImportant(id: string): Promise<Note> {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) throw new Error('Nota não encontrada');

    return this.prisma.note.update({
      where: { id },
      data: { isImportant: !note.isImportant },
    });
  }

  async duplicate(id: string, userId: string): Promise<Note> {
    const original = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!original) throw new Error('Nota não encontrada');

    return this.prisma.note.create({
      data: {
        leadId: original.leadId,
        content: `[CÓPIA] ${original.content}`,
        category: original.category,
        isImportant: original.isImportant,
        createdById: userId,
      },
    });
  }

  async search(query: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getCategories(): Promise<string[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return notes
      .map(n => n.category)
      .filter((c): c is string => c !== null);
  }
}
```

---

## 📦 MÓDULO 4: TAGS

### 4.1 Endpoints (12 total)

```typescript
GET    /api/tags                       // Listar todas
GET    /api/tags/:id                   // Buscar por ID
POST   /api/tags                       // Criar tag
PUT    /api/tags/:id                   // Atualizar tag
DELETE /api/tags/:id                   // Deletar tag
GET    /api/tags/system                // Tags do sistema
GET    /api/tags/popular               // Tags mais usadas
GET    /api/tags/stats                 // Estatísticas de uso
POST   /api/tags/rules                 // Criar regra automática
GET    /api/tags/rules                 // Listar regras
DELETE /api/tags/rules/:id             // Deletar regra
POST   /api/tags/apply-rules           // Aplicar regras manualmente
```

### 4.2 Service Layer

**tags.service.ts**:
```typescript
import { PrismaClient, Tag, TagRule } from '@prisma/client';

export interface CreateTagDTO {
  name: string;
  color: string;
  description?: string;
  isSystem?: boolean;
}

export interface CreateTagRuleDTO {
  tagId: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  };
  isActive: boolean;
}

export class TagsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTagDTO): Promise<Tag> {
    // Verificar se já existe tag com mesmo nome
    const existing = await this.prisma.tag.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new Error('Tag com este nome já existe');
    }

    return this.prisma.tag.create({
      data,
    });
  }

  async findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findSystemTags(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPopular(limit: number = 10): Promise<Array<Tag & { _count: number }>> {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: {
        leads: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags.map(tag => ({
      ...tag,
      _count: tag._count.leads,
    }));
  }

  async getStats(): Promise<Record<string, number>> {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return Object.fromEntries(
      tags.map(tag => [tag.name, tag._count.leads])
    );
  }

  async update(id: string, data: Partial<CreateTagDTO>): Promise<Tag> {
    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (tag?.isSystem) {
      throw new Error('Tags do sistema não podem ser deletadas');
    }

    await this.prisma.tag.delete({
      where: { id },
    });
  }

  // Regras automáticas
  async createRule(data: CreateTagRuleDTO): Promise<TagRule> {
    return this.prisma.tagRule.create({
      data: {
        tagId: data.tagId,
        condition: data.condition as any,
        isActive: data.isActive,
      },
    });
  }

  async getRules(): Promise<TagRule[]> {
    return this.prisma.tagRule.findMany({
      include: {
        tag: true,
      },
    });
  }

  async deleteRule(id: string): Promise<void> {
    await this.prisma.tagRule.delete({
      where: { id },
    });
  }

  async applyRules(leadId?: string): Promise<number> {
    const rules = await this.prisma.tagRule.findMany({
      where: { isActive: true },
      include: { tag: true },
    });

    const whereClause = leadId ? { id: leadId } : {};
    const leads = await this.prisma.lead.findMany({
      where: whereClause,
    });

    let appliedCount = 0;

    for (const lead of leads) {
      for (const rule of rules) {
        const condition = rule.condition as any;
        const fieldValue = lead[condition.field as keyof typeof lead];

        if (typeof fieldValue === 'string') {
          let matches = false;

          switch (condition.operator) {
            case 'equals':
              matches = fieldValue === condition.value;
              break;
            case 'contains':
              matches = fieldValue.includes(condition.value);
              break;
            case 'startsWith':
              matches = fieldValue.startsWith(condition.value);
              break;
            case 'endsWith':
              matches = fieldValue.endsWith(condition.value);
              break;
          }

          if (matches) {
            await this.prisma.lead.update({
              where: { id: lead.id },
              data: {
                tags: {
                  connect: { id: rule.tagId },
                },
              },
            });
            appliedCount++;
          }
        }
      }
    }

    return appliedCount;
  }
}
```

---

## 🧪 TESTES UNITÁRIOS

### Exemplo: leads.service.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeadsService } from './leads.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  lead: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
} as unknown as PrismaClient;

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(() => {
    service = new LeadsService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um lead com sucesso', async () => {
      const mockLead = {
        id: '123',
        name: 'Test Lead',
        phone: '+5511999999999',
        email: 'test@test.com',
        status: 'NOVO',
        priority: 'MEDIUM',
        score: 50,
      };

      mockPrisma.lead.create = vi.fn().mockResolvedValue(mockLead);

      const result = await service.create({
        name: 'Test Lead',
        phone: '+5511999999999',
        email: 'test@test.com',
      }, 'user-123');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Lead');
      expect(mockPrisma.lead.create).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar lead duplicado', async () => {
      service.findDuplicates = vi.fn().mockResolvedValue([{ score: 100 }]);

      await expect(
        service.create({
          name: 'Test',
          phone: '+5511999999999',
        }, 'user-123')
      ).rejects.toThrow('Lead duplicado detectado');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de leads', async () => {
      const mockLeads = [
        { id: '1', name: 'Lead 1' },
        { id: '2', name: 'Lead 2' },
      ];

      mockPrisma.lead.findMany = vi.fn().mockResolvedValue(mockLeads);
      mockPrisma.lead.count = vi.fn().mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });
});
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Módulo Leads
- [ ] Criar tipos TypeScript (leads.types.ts)
- [ ] Criar validações Zod (leads.validators.ts)
- [ ] Implementar service (leads.service.ts)
- [ ] Implementar controller (leads.controller.ts)
- [ ] Criar rotas (leads.routes.ts)
- [ ] Implementar testes unitários (90% coverage)
- [ ] Implementar testes de integração
- [ ] Documentar endpoints (Swagger/OpenAPI)

### Módulo Leads Parciais
- [ ] Criar tipos e validações
- [ ] Implementar service
- [ ] Implementar controller
- [ ] Criar rotas
- [ ] Criar job de cleanup automático
- [ ] Implementar testes

### Módulo Notas
- [ ] Criar tipos e validações
- [ ] Implementar service
- [ ] Implementar controller
- [ ] Criar rotas
- [ ] Implementar testes

### Módulo Tags
- [ ] Criar tipos e validações
- [ ] Implementar service com regras automáticas
- [ ] Implementar controller
- [ ] Criar rotas
- [ ] Implementar job de aplicação de regras
- [ ] Implementar testes

### Integrações
- [ ] Registrar rotas no app.ts
- [ ] Configurar permissões
- [ ] Testar fluxo completo
- [ ] Validar performance
- [ ] Documentar API

---

## 📊 MÉTRICAS DE SUCESSO

- ✅ **Coverage de testes**: ≥ 90%
- ✅ **Tempo de resposta**: < 200ms (p95)
- ✅ **Zero uso de `any`**: 100% tipado
- ✅ **Validações**: 100% com Zod
- ✅ **Documentação**: Todos os endpoints documentados

---

## 🚀 PRÓXIMOS PASSOS

Após concluir Fase 8:
1. **Revisar** código com equipe
2. **Merge** para branch de desenvolvimento
3. **Iniciar** Fase 9 (APIs Avançadas)
4. **Monitorar** performance em staging

---

**Última atualização**: 2025-10-10
**Status**: Documentação completa - Pronta para implementação
