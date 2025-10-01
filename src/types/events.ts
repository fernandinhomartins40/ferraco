// Tipos para eventos e handlers

import { Lead, TagDefinition, AutomationRule } from './lead';

// Event handlers genéricos
export interface EventHandler<T = void> {
  (data: T): void;
}

export interface AsyncEventHandler<T = void> {
  (data: T): Promise<void>;
}

// Form events
export interface FormSubmitHandler {
  (event: React.FormEvent<HTMLFormElement>): void;
}

export interface FormChangeHandler {
  (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void;
}

export interface ButtonClickHandler {
  (event: React.MouseEvent<HTMLButtonElement>): void;
}

// Lead events
export interface LeadEventHandler {
  (lead: Lead): void;
}

export interface LeadSelectHandler {
  (leadId: string): void;
}

export interface LeadUpdateHandler {
  (leadId: string, updates: Partial<Lead>): void;
}

// Tag events
export interface TagEventHandler {
  (tag: TagDefinition): void;
}

export interface TagSelectHandler {
  (tagId: string): void;
}

// Automation events
export interface AutomationEventHandler {
  (automation: AutomationRule): void;
}

export interface AutomationToggleHandler {
  (automationId: string, isActive: boolean): void;
}

// Generic data handlers
export interface DataChangeHandler<T> {
  (oldValue: T, newValue: T): void;
}

export interface DataLoadHandler<T> {
  (data: T): void;
}

export interface ErrorHandler {
  (error: Error | string): void;
}
