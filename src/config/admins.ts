export interface AdminInfo {
  email: string;
  nome: string;
}

/**
 * Lista canônica de administradores.
 * Deve ser mantida em sincronia com as regras do Firestore.
 * Ao adicionar/remover, atualize TAMBÉM:
 *   - Firestore Console → Firestore Database → Regras
 */
export const ADMINS: AdminInfo[] = [
  { email: 'luidesmatheusdev@gmail.com', nome: 'Luides Matheus' },
  { email: 'baba.gtf.videos@gmail.com', nome: 'BABA GTF Vídeos' },
  { email: 'vinijr18@gmail.com', nome: 'Vini JR' },
  { email: 'fabiodoamordivino@gmail.com', nome: 'Fábio do Amor Divino' },
  { email: 'rizmario@gmail.com', nome: 'Rizmário' },
];

export function getAdminByEmail(email: string | null | undefined): AdminInfo | null {
  if (!email) return null;
  const lower = email.toLowerCase();
  return ADMINS.find((a) => a.email.toLowerCase() === lower) || null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return getAdminByEmail(email) !== null;
}