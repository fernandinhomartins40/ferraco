// Tipos para Storage e LocalStorage

export interface StorageData<T> {
  items: T[];
  version: number;
  lastUpdate: string;
}

export type StorageKey = string;
export type StorageValue = string | object | null;

// Callbacks tipados para storages
export interface StorageChangeCallback<T> {
  (items: T[]): void;
}

export interface StorageErrorCallback {
  (error: Error): void;
}

// Eventos de storage
export interface StorageEvent<T> {
  key: string;
  oldValue: T[] | null;
  newValue: T[] | null;
  timestamp: number;
}

// Handlers para sync
export interface StorageSyncHandler {
  (): Promise<void>;
}

export interface StorageValidator<T> {
  (item: T): boolean;
}
