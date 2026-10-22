import { useState, useEffect } from 'react';

export function useSessionState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Erro ao salvar filtro no sessionStorage', e);
    }
  }, [key, state]);

  return [state, setState] as const;
}