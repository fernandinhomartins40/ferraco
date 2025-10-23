/**
 * VariableInserter - Componente para inserir variáveis em templates de mensagem
 *
 * Exibe botões clicáveis para cada variável disponível, facilitando a inserção
 * no campo de texto sem necessidade de digitar manualmente
 */

import { Button } from './button';
import { Badge } from './badge';
import { Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Variable {
  key: string;
  label: string;
  description?: string;
}

interface VariableInserterProps {
  variables: Variable[];
  onInsert: (variable: string) => void;
  className?: string;
  variant?: 'buttons' | 'badges';
  title?: string;
}

export function VariableInserter({
  variables,
  onInsert,
  className,
  variant = 'badges',
  title = 'Variáveis disponíveis:',
}: VariableInserterProps) {
  const handleInsert = (key: string) => {
    onInsert(`{{${key}}}`);
  };

  if (variant === 'buttons') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Code2 className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <Button
              key={variable.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInsert(variable.key)}
              className="h-7 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              title={variable.description || `Inserir {{${variable.key}}}`}
            >
              <Code2 className="h-3 w-3 mr-1" />
              {variable.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Code2 className="h-3 w-3" />
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <Badge
            key={variable.key}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => handleInsert(variable.key)}
            title={variable.description || `Inserir {{${variable.key}}}`}
          >
            {`{{${variable.key}}}`}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Variáveis padrão do sistema
export const DEFAULT_LEAD_VARIABLES: Variable[] = [
  { key: 'nome', label: 'Nome', description: 'Nome do lead' },
  { key: 'telefone', label: 'Telefone', description: 'Telefone do lead' },
  { key: 'email', label: 'Email', description: 'Email do lead' },
  { key: 'empresa', label: 'Empresa', description: 'Empresa do lead' },
];

export const PRODUCT_VARIABLES: Variable[] = [
  { key: 'produto', label: 'Produto', description: 'Nome do produto' },
  { key: 'preco', label: 'Preço', description: 'Preço do produto' },
];

export const DATE_VARIABLES: Variable[] = [
  { key: 'data', label: 'Data', description: 'Data atual' },
  { key: 'hora', label: 'Hora', description: 'Hora atual' },
];
