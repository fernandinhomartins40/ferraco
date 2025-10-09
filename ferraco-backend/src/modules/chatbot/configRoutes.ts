import { Router } from 'express';
import { ConfigController } from './configController';
import { authenticate } from '../../middleware/auth';

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
router.get('/company', authenticate, controller.getCompanyData.bind(controller));
router.post('/company', authenticate, controller.saveCompanyData.bind(controller));

// Products
router.get('/products', authenticate, controller.getProducts.bind(controller));
router.post('/products', authenticate, controller.createProduct.bind(controller));
router.put('/products/:id', authenticate, controller.updateProduct.bind(controller));
router.delete('/products/:id', authenticate, controller.deleteProduct.bind(controller));

// FAQs
router.get('/faqs', authenticate, controller.getFAQs.bind(controller));
router.post('/faqs', authenticate, controller.createFAQ.bind(controller));
router.put('/faqs/:id', authenticate, controller.updateFAQ.bind(controller));
router.delete('/faqs/:id', authenticate, controller.deleteFAQ.bind(controller));

// Chatbot Config
router.get('/chatbot-config', authenticate, controller.getChatbotConfig.bind(controller));
router.post('/chatbot-config', authenticate, controller.saveChatbotConfig.bind(controller));

// Chat Links
router.get('/chat-links', authenticate, controller.getChatLinks.bind(controller));
router.post('/chat-links', authenticate, controller.createChatLink.bind(controller));
router.delete('/chat-links/:id', authenticate, controller.deleteChatLink.bind(controller));

export default router;
