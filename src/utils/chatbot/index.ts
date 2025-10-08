/**
 * Chatbot Inteligente Baseado em Regras
 * Exportações principais
 */

// Types
export * from './types';

// Core Components
export { IntentClassifier, intentClassifier } from './intentClassifier';
export { KnowledgeBaseMatcher, knowledgeBaseMatcher } from './knowledgeBaseMatcher';
export { ResponseGenerator, responseGenerator } from './responseGenerator';
export { LeadCaptureSystem, leadCaptureSystem } from './leadCaptureSystem';
export { ConversationManager, createConversationManager } from './conversationManager';

// Configuration
export { intentsConfig } from './intents.config';
