export interface Config {
  pin: string;
  mensalidadePadrao: number;
  valorFesta: number;
  saldoAbertura: number;
  anoExercicio: number;
}

export interface Associado {
  id: string;
  nome: string;
  apelido: string;
  entrada: number;
  saida?: number;
  status: 'ativo' | 'inativo' | 'ex-associado';
  editedAt?: string;
  editedBy?: string;
  editedByName?: string;
}

export type TipoLanc =
  | 'mensalidade'
  | 'festa'
  | 'visitante'
  | 'ex-associado'
  | 'rendimento'
  | 'extra'
  | 'perdao';

export interface Lancamento {
  id: string;
  data: string;
  tipo: TipoLanc;
  associadoId: string | null;
  convidadorId?: string | null;
  nome?: string | null;
  competencia: { mes: number; ano: number } | null;
  valor: number;
  formaPagamento: string;
  observacao?: string;
  editedAt?: string;
  editedBy?: string;
  editedByName?: string;
  anulado?: boolean;
  anuladoEm?: string;
  anuladoPor?: string;
  anuladoPorNome?: string;
  motivoAnulacao?: string;
}

export type CategoriaDespesa = 'juiz' | 'goleiro' | 'bola' | 'outras';

export interface Despesa {
  id: string;
  data: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  observacao?: string;
  editedAt?: string;
  editedBy?: string;
  editedByName?: string;
  anulado?: boolean;
  anuladoEm?: string;
  anuladoPor?: string;
  anuladoPorNome?: string;
  motivoAnulacao?: string;
}

export interface Campanha {
  nome: string;
  meta: number;
  valorSugerido: number;
}

export interface Snapshot {
  id: string;
  mes: number;
  ano: number;
  receitas: number;
  despesas: number;
  liquido: number;
  saldoFinal: number;
  geradoEm: string;
}

export interface AppState {
  config: Config;
  campanha: Campanha;
  associados: Associado[];
  lancamentos: Lancamento[];
  despesas: Despesa[];
  snapshots: Snapshot[];
}