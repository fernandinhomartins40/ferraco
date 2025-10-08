import { Router } from 'express';
import chatbotController from './chatbotController';
import productsController from './productsController';

const router = Router();

// ==========================================
// CHAT (público)
// ==========================================
router.post('/message', (req, res) => chatbotController.sendMessage(req, res));
router.get('/health', (req, res) => chatbotController.checkHealth(req, res));

// ==========================================
// IA - Extração de dados
// ==========================================
router.post('/extract-data', (req, res) => chatbotController.extractData(req, res));
router.post('/fusechat-proxy', (req, res) => chatbotController.fusechatProxy(req, res));

// ==========================================
// FUSECHAT - Gerenciamento RAG e Guardrails
// ==========================================
router.post('/fusechat/sync-knowledge', (req, res) => chatbotController.syncFuseChatKnowledge(req, res));
router.post('/fusechat/sync-guardrails', (req, res) => chatbotController.syncFuseChatGuardrails(req, res));
router.get('/fusechat/knowledge', (req, res) => chatbotController.getFuseChatKnowledge(req, res));
router.get('/fusechat/guardrails', (req, res) => chatbotController.getFuseChatGuardrails(req, res));
router.get('/fusechat/stats', (req, res) => chatbotController.getFuseChatStats(req, res));

// ==========================================
// ADMIN - História e contexto
// ==========================================
router.get('/history/:leadId', (req, res) => chatbotController.getHistory(req, res));
router.get('/context', (req, res) => chatbotController.getContext(req, res));

// ==========================================
// ADMIN - Produtos
// ==========================================
router.get('/products', (req, res) => productsController.listProducts(req, res));
router.post('/products', (req, res) => productsController.createProduct(req, res));
router.put('/products/:id', (req, res) => productsController.updateProduct(req, res));
router.delete('/products/:id', (req, res) => productsController.deleteProduct(req, res));
router.patch('/products/:id/toggle', (req, res) => productsController.toggleProduct(req, res));

// ==========================================
// ADMIN - FAQs
// ==========================================
router.get('/faqs', (req, res) => productsController.listFAQs(req, res));
router.post('/faqs', (req, res) => productsController.createFAQ(req, res));
router.put('/faqs/:id', (req, res) => productsController.updateFAQ(req, res));
router.delete('/faqs/:id', (req, res) => productsController.deleteFAQ(req, res));

// ==========================================
// ADMIN - Dados da Empresa
// ==========================================
router.get('/company', (req, res) => productsController.getCompany(req, res));
router.post('/company', (req, res) => productsController.saveCompany(req, res));

export default router;
