import { useAuthStore } from '../store/useAuthStore';
import { getAdminByEmail } from '../config/admins';

export function getAuditFields(): {
  editedAt: string;
  editedBy?: string;
  editedByName?: string;
} {
  const user = useAuthStore.getState().user;
  if (!user) {
    return { editedAt: new Date().toISOString() };
  }
  const admin = getAdminByEmail(user.email);
  return {
    editedAt: new Date().toISOString(),
    editedBy: user.email || undefined,
    editedByName: admin?.nome || user.displayName || 'Desconhecido',
  };
}

export function getAnularFields(): {
  anuladoEm: string;
  anuladoPor?: string;
  anuladoPorNome?: string;
} {
  const user = useAuthStore.getState().user;
  if (!user) {
    return { anuladoEm: new Date().toISOString() };
  }
  const admin = getAdminByEmail(user.email);
  return {
    anuladoEm: new Date().toISOString(),
    anuladoPor: user.email || undefined,
    anuladoPorNome: admin?.nome || user.displayName || 'Desconhecido',
  };
}