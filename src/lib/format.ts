export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n: number | undefined) =>
  (Math.round((n || 0) * 100) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtBR = (n: number | undefined) => 'R$ ' + fmt(n);

export const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const monthsShort = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const monthName = (m: number) => months[m - 1] ?? '—';
export const monthShort = (m: number) => monthsShort[m - 1] ?? '—';

export const brDate = (iso?: string) =>
  iso ? iso.split('T')[0].split('-').reverse().join('/') : '—';

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const tipoLabel: Record<string, string> = {
  mensalidade: 'Mensalidade',
  festa: 'Festa',
  visitante: 'Visitante',
  'ex-associado': 'Ex-associado',
  rendimento: 'Rendimento',
  extra: 'Extra',
  perdao: 'Perdão de Dívida',
};

export const categoriaLabel: Record<string, string> = {
  juiz: 'Juiz',
  goleiro: 'Goleiro',
  bola: 'Bola',
  outras: 'Outras',
};