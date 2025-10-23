/**
 * useVariableInsertion - Hook para facilitar inserção de variáveis em inputs/textareas
 *
 * Gerencia a posição do cursor e insere variáveis mantendo o contexto
 */

import { useRef, useCallback } from 'react';

export function useVariableInsertion() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorPositionRef = useRef<number>(0);

  // Salvar posição do cursor quando o campo perde o foco
  const handleBlur = useCallback(() => {
    if (textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart;
    }
  }, []);

  // Inserir variável na posição do cursor
  const insertVariable = useCallback(
    (variable: string, currentValue: string, onChange: (value: string) => void) => {
      const textarea = textareaRef.current;
      const safeValue = currentValue || '';

      if (!textarea) {
        // Fallback: adicionar no final
        onChange(safeValue + variable);
        return;
      }

      const position = cursorPositionRef.current;
      const newValue = safeValue.slice(0, position) + variable + safeValue.slice(position);

      onChange(newValue);

      // Refocar e posicionar o cursor após a variável inserida
      setTimeout(() => {
        textarea.focus();
        const newPosition = position + variable.length;
        textarea.setSelectionRange(newPosition, newPosition);
        cursorPositionRef.current = newPosition;
      }, 0);
    },
    []
  );

  return {
    textareaRef,
    handleBlur,
    insertVariable,
  };
}
