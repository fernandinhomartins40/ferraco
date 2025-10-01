import { logger } from '@/lib/logger';

export interface StorageItem {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageConfig {
  key: string;
  enableDebug?: boolean;
}

export abstract class BaseStorage<T extends StorageItem> {
  protected key: string;
  protected data: T[] = [];
  protected enableDebug: boolean;

  constructor(config: StorageConfig) {
    this.key = config.key;
    this.enableDebug = config.enableDebug || false;
    this.load();
  }

  // Métodos de persistência
  protected load(): void {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        this.data = JSON.parse(stored);
        this.log(`Loaded ${this.data.length} items`);
      }
    } catch (error) {
      logger.error(`Error loading ${this.key}:`, error);
      this.data = [];
    }
  }

  protected save(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
      this.log(`Saved ${this.data.length} items`);
    } catch (error) {
      logger.error(`Error saving ${this.key}:`, error);
    }
  }

  // CRUD Operations
  public getAll(): T[] {
    return [...this.data];
  }

  public getById(id: string): T | null {
    return this.data.find(item => item.id === id) || null;
  }

  public add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const newItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as T;

    this.data.push(newItem);
    this.save();
    this.log(`Added item ${newItem.id}`);
    return newItem;
  }

  public update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    this.log(`Updated item ${id}`);
    return this.data[index];
  }

  public delete(id: string): boolean {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);

    if (this.data.length < initialLength) {
      this.save();
      this.log(`Deleted item ${id}`);
      return true;
    }
    return false;
  }

  // Query Operations
  public filter(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate);
  }

  public search(query: string, fields: (keyof T)[]): T[] {
    const lowerQuery = query.toLowerCase();
    return this.data.filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }

  public count(): number {
    return this.data.length;
  }

  public clear(): void {
    this.data = [];
    this.save();
    this.log('Cleared all items');
  }

  // Utilities
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected log(message: string): void {
    if (this.enableDebug) {
      logger.debug(`[${this.key}] ${message}`);
    }
  }

  // Export/Import
  public export(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public import(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        this.data = imported;
        this.save();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
