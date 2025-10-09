import { Router } from 'express';
import { ConfigController } from './configController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const controller = new ConfigController();

// ============================================
// PUBLIC ROUTES (sem autenticação)
// ============================================

// Chatbot Data - endpoint público para o chat
router.get('/chatbot-data', controller.getChatbotData.bind(controller));

// ============================================
// PROTECTED ROUTES (requer autenticação)
// ============================================

// Company Data
router.get('/company', authMiddleware, controller.getCompanyData.bind(controller));
router.post('/company', authMiddleware, controller.saveCompanyData.bind(controller));

// Products
router.get('/products', authMiddleware, controller.getProducts.bind(controller));
router.post('/products', authMiddleware, controller.createProduct.bind(controller));
router.put('/products/:id', authMiddleware, controller.updateProduct.bind(controller));
router.delete('/products/:id', authMiddleware, controller.deleteProduct.bind(controller));

// FAQs
router.get('/faqs', authMiddleware, controller.getFAQs.bind(controller));
router.post('/faqs', authMiddleware, controller.createFAQ.bind(controller));
router.put('/faqs/:id', authMiddleware, controller.updateFAQ.bind(controller));
router.delete('/faqs/:id', authMiddleware, controller.deleteFAQ.bind(controller));

// Chatbot Config
router.get('/chatbot-config', authMiddleware, controller.getChatbotConfig.bind(controller));
router.post('/chatbot-config', authMiddleware, controller.saveChatbotConfig.bind(controller));

// Chat Links
router.get('/chat-links', authMiddleware, controller.getChatLinks.bind(controller));
router.post('/chat-links', authMiddleware, controller.createChatLink.bind(controller));
router.delete('/chat-links/:id', authMiddleware, controller.deleteChatLink.bind(controller));

export default router;
