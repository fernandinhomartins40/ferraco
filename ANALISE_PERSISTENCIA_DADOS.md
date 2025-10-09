# 🔍 Análise: Persistência de Dados do Chatbot

## ⚠️ PROBLEMA IDENTIFICADO

### **Situação Atual:**

#### **1. Dados do Admin (/admin/ai) - LocalStorage ❌**
```typescript
// src/utils/aiChatStorage.ts
class AIChatStorage {
  private readonly STORAGE_KEY_COMPANY = 'ferraco_ai_company';
  private readonly STORAGE_KEY_PRODUCTS = 'ferraco_ai_products';
  private readonly STORAGE_KEY_CONFIG = 'ferraco_ai_config';

  getCompanyData(): CompanyData | null {
    const data = localStorage.getItem(this.STORAGE_KEY_COMPANY); // ❌ LocalStorage
    return data ? JSON.parse(data) : null;
  }
}
```

**❌ Todos os dados cadastrados em `/admin/ai` estão APENAS no localStorage:**
- Dados da empresa
- Produtos
- FAQs
- Links de chat
- Configurações de IA

**Consequências:**
- ❌ Dados perdidos ao limpar cache do navegador
- ❌ Não compartilhados entre usuários/dispositivos
- ❌ Não há backup
- ❌ Admin precisa recadastrar tudo se trocar de navegador

---

#### **2. Chatbot (useChatbotAI) - LocalStorage ✅ (parcial)**
```typescript
// src/hooks/useChatbotAI.ts
const companyData = aiChatStorage.getCompanyData(); // ❌ LocalStorage
const products = aiChatStorage.getProducts();       // ❌ LocalStorage
const faqs = aiChatStorage.getFAQItems();          // ❌ LocalStorage
```

**✅ O chatbot USA os dados persistidos, mas...**
**❌ Eles estão no localStorage do navegador do CLIENTE**

**Problema:**
- Cliente A configura admin → dados no localStorage do Cliente A
- Cliente B acessa chat → **NÃO tem os dados** (localStorage vazio)
- Cada cliente tem seus próprios dados locais

---

#### **3. Backend Existe mas NÃO é Usado ⚠️**
```typescript
// ferraco-backend/src/modules/chatbot/chatbotController.ts
export class ChatbotController {
  async sendMessage(req: Request, res: Response) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    // Backend tem integração com Prisma/BD
  }
}
```

**Situação:**
- ✅ Backend tem estrutura para salvar no BD
- ❌ Frontend (admin) NÃO usa o backend
- ❌ Chatbot NÃO usa o backend

---

## 📊 Comparação: Como Está vs Como Deveria Ser

### **COMO ESTÁ AGORA (❌ Errado):**

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR ADMIN                      │
├─────────────────────────────────────────────────────────┤
│  /admin/ai                                              │
│  ↓ Salva dados                                          │
│  localStorage (navegador)  ← ❌ PROBLEMA                │
│    - Empresa: {...}                                     │
│    - Produtos: [...]                                    │
│    - FAQs: [...]                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR CLIENTE 1                    │
├─────────────────────────────────────────────────────────┤
│  /chat/ABC123                                           │
│  ↓ Busca dados                                          │
│  localStorage (vazio)  ← ❌ NÃO TEM DADOS               │
│  Bot não funciona corretamente                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR CLIENTE 2                    │
├─────────────────────────────────────────────────────────┤
│  /chat/ABC123                                           │
│  ↓ Busca dados                                          │
│  localStorage (vazio)  ← ❌ NÃO TEM DADOS               │
│  Bot não funciona corretamente                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (Prisma)                    │
├─────────────────────────────────────────────────────────┤
│  ❌ Vazio (não usado)                                   │
│  Backend existe mas frontend não usa                    │
└─────────────────────────────────────────────────────────┘
```

### **COMO DEVERIA SER (✅ Correto):**

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR ADMIN                      │
├─────────────────────────────────────────────────────────┤
│  /admin/ai                                              │
│  ↓ POST /api/config/company                            │
│  ↓ POST /api/config/products                           │
│  ↓ POST /api/config/faqs                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓ Salva no BD
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (Prisma)                    │
├─────────────────────────────────────────────────────────┤
│  ✅ Empresas                                            │
│  ✅ Produtos                                            │
│  ✅ FAQs                                                │
│  ✅ Configurações                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓ Busca do BD
┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR CLIENTE 1                    │
├─────────────────────────────────────────────────────────┤
│  /chat/ABC123                                           │
│  ↓ GET /api/config/chatbot-data                        │
│  ✅ Recebe todos os dados do BD                        │
│  Bot funciona perfeitamente                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  NAVEGADOR CLIENTE 2                    │
├─────────────────────────────────────────────────────────┤
│  /chat/ABC123                                           │
│  ↓ GET /api/config/chatbot-data                        │
│  ✅ Recebe todos os dados do BD                        │
│  Bot funciona perfeitamente                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ SOLUÇÃO PROPOSTA

### **Fase 1: Backend - Criar APIs de Configuração**

#### **1.1. Schema Prisma (adicionar tabelas)**
```prisma
// prisma/schema.prisma

model ChatbotConfig {
  id                String   @id @default(uuid())
  toneOfVoice       String   @default("friendly")
  greetingMessage   String
  enableSmallTalk   Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model CompanyData {
  id              String   @id @default(uuid())
  name            String
  industry        String
  description     String
  differentials   String[] // Array de strings
  targetAudience  String
  location        String
  workingHours    String
  website         String?
  phone           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  category    String
  price       String?
  keywords    String[] // Array de strings
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FAQ {
  id        String   @id @default(uuid())
  question  String
  answer    String
  category  String
  keywords  String[] // Array de strings
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatLink {
  id        String   @id @default(uuid())
  name      String
  source    String
  url       String
  shortCode String   @unique
  clicks    Int      @default(0)
  leads     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **1.2. Controller (Backend)**
```typescript
// ferraco-backend/src/modules/chatbot/configController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConfigController {

  // ============================================
  // COMPANY DATA
  // ============================================

  async getCompanyData(req: Request, res: Response) {
    try {
      const company = await prisma.companyData.findFirst();
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
    }
  }

  async saveCompanyData(req: Request, res: Response) {
    try {
      const data = req.body;

      // Upsert (update or insert)
      const company = await prisma.companyData.upsert({
        where: { id: data.id || 'default' },
        update: data,
        create: { ...data, id: 'default' }
      });

      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar dados da empresa' });
    }
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const product = await prisma.product.create({
        data: req.body
      });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.update({
        where: { id },
        data: req.body
      });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar produto' });
    }
  }

  // ============================================
  // FAQs
  // ============================================

  async getFAQs(req: Request, res: Response) {
    try {
      const faqs = await prisma.fAQ.findMany({
        orderBy: { order: 'asc' }
      });
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar FAQs' });
    }
  }

  async createFAQ(req: Request, res: Response) {
    try {
      const faq = await prisma.fAQ.create({
        data: req.body
      });
      res.json(faq);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar FAQ' });
    }
  }

  // ============================================
  // CHATBOT DATA (Endpoint único para o chat público)
  // ============================================

  async getChatbotData(req: Request, res: Response) {
    try {
      const [config, company, products, faqs] = await Promise.all([
        prisma.chatbotConfig.findFirst(),
        prisma.companyData.findFirst(),
        prisma.product.findMany({ where: { isActive: true } }),
        prisma.fAQ.findMany({ orderBy: { order: 'asc' } })
      ]);

      res.json({
        config: config || {},
        company: company || {},
        products: products || [],
        faqs: faqs || []
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados do chatbot' });
    }
  }
}
```

#### **1.3. Rotas (Backend)**
```typescript
// ferraco-backend/src/modules/chatbot/configRoutes.ts

import { Router } from 'express';
import { ConfigController } from './configController';

const router = Router();
const controller = new ConfigController();

// Company
router.get('/config/company', controller.getCompanyData.bind(controller));
router.post('/config/company', controller.saveCompanyData.bind(controller));

// Products
router.get('/config/products', controller.getProducts.bind(controller));
router.post('/config/products', controller.createProduct.bind(controller));
router.put('/config/products/:id', controller.updateProduct.bind(controller));
router.delete('/config/products/:id', controller.deleteProduct.bind(controller));

// FAQs
router.get('/config/faqs', controller.getFAQs.bind(controller));
router.post('/config/faqs', controller.createFAQ.bind(controller));

// Chatbot Data (endpoint público para o chat)
router.get('/config/chatbot-data', controller.getChatbotData.bind(controller));

export default router;
```

---

### **Fase 2: Frontend - Migrar de LocalStorage para API**

#### **2.1. Criar apiClient para configurações**
```typescript
// src/utils/configApiClient.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const configApi = {
  // Company
  getCompanyData: () => axios.get(`${API_URL}/config/company`),
  saveCompanyData: (data: any) => axios.post(`${API_URL}/config/company`, data),

  // Products
  getProducts: () => axios.get(`${API_URL}/config/products`),
  createProduct: (data: any) => axios.post(`${API_URL}/config/products`, data),
  updateProduct: (id: string, data: any) => axios.put(`${API_URL}/config/products/${id}`, data),
  deleteProduct: (id: string) => axios.delete(`${API_URL}/config/products/${id}`),

  // FAQs
  getFAQs: () => axios.get(`${API_URL}/config/faqs`),
  createFAQ: (data: any) => axios.post(`${API_URL}/config/faqs`, data),

  // Chatbot Data (para o chat público)
  getChatbotData: () => axios.get(`${API_URL}/config/chatbot-data`)
};
```

#### **2.2. Atualizar AdminAI.tsx**
```typescript
// src/pages/admin/AdminAI.tsx

import { configApi } from '@/utils/configApiClient';

const AdminAI = () => {
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companyRes, productsRes, faqsRes] = await Promise.all([
        configApi.getCompanyData(),
        configApi.getProducts(),
        configApi.getFAQs()
      ]);

      setCompanyData(companyRes.data);
      setProducts(productsRes.data);
      setFAQs(faqsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSaveCompany = async () => {
    try {
      await configApi.saveCompanyData(companyData);
      toast.success('Dados salvos no banco de dados!');
    } catch (error) {
      toast.error('Erro ao salvar dados');
    }
  };
};
```

#### **2.3. Atualizar useChatbotAI.ts**
```typescript
// src/hooks/useChatbotAI.ts

import { configApi } from '@/utils/configApiClient';

export function useChatbotAI(linkSource: string) {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseContext | null>(null);

  // Carregar dados do BACKEND ao invés do localStorage
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      try {
        const { data } = await configApi.getChatbotData();

        setKnowledgeBase({
          companyData: data.company,
          products: data.products,
          faqs: data.faqs,
          aiConfig: data.config
        });
      } catch (error) {
        console.error('Erro ao carregar knowledge base:', error);
      }
    };

    loadKnowledgeBase();
  }, []);

  // Resto do código...
}
```

---

## ✅ BENEFÍCIOS DA MIGRAÇÃO

| Aspecto | LocalStorage (Atual) | Banco de Dados (Proposto) |
|---------|---------------------|----------------------------|
| **Persistência** | ❌ Temporária | ✅ Permanente |
| **Compartilhamento** | ❌ Apenas 1 navegador | ✅ Todos os clientes |
| **Backup** | ❌ Não | ✅ Sim (BD) |
| **Segurança** | ❌ Baixa | ✅ Alta |
| **Escalabilidade** | ❌ Limitada | ✅ Ilimitada |
| **Multi-usuário** | ❌ Não | ✅ Sim |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Backend:**
- [ ] Criar schema Prisma (tabelas)
- [ ] Rodar migrations: `npx prisma migrate dev`
- [ ] Criar ConfigController
- [ ] Criar configRoutes.ts
- [ ] Registrar rotas no server.ts
- [ ] Testar endpoints com Postman

### **Frontend:**
- [ ] Criar configApiClient.ts
- [ ] Atualizar AdminAI.tsx (usar API)
- [ ] Atualizar useChatbotAI.ts (usar API)
- [ ] Migrar dados existentes do localStorage → BD
- [ ] Remover aiChatStorage.ts (deprecated)
- [ ] Testar fluxo completo

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

**Quer que eu implemente essa solução agora?**

1. ✅ Criar schema Prisma
2. ✅ Criar backend (controller + routes)
3. ✅ Criar frontend (apiClient)
4. ✅ Atualizar AdminAI e useChatbotAI
5. ✅ Testar e validar

**Isso resolverá 100% o problema de persistência!** 🎯
