import type { AppState, Associado, Lancamento } from '../types';

function getAnoBase(s: AppState, ano?: number): number {
  return ano ?? s.config.anoExercicio;
}

export function calcularAberturaAno(s: AppState, ano: number): number {
  if (ano === s.config.anoExercicio) return s.config.saldoAbertura;
  if (ano < s.config.anoExercicio) return 0;
  let acc = s.config.saldoAbertura;
  for (let a = s.config.anoExercicio; a < ano; a++) {
    acc += receitaTotal(s, a) - despesaTotal(s, a);
  }
  return acc;
}

export function receitaTotal(s: AppState, ano?: number) {
  const a = getAnoBase(s, ano);
  return s.lancamentos
    .filter((l) => !l.anulado && l.competencia?.ano === a)
    .reduce((acc, l) => acc + l.valor, 0);
}

export function despesaTotal(s: AppState, ano?: number) {
  const a = getAnoBase(s, ano);
  return s.despesas
    .filter((d) => !d.anulado && d.data.startsWith(String(a)))
    .reduce((acc, d) => acc + d.valor, 0);
}

export function saldoAtual(s: AppState, ano?: number) {
  const a = getAnoBase(s, ano);
  return calcularAberturaAno(s, a) + receitaTotal(s, a) - despesaTotal(s, a);
}

export function receitaMes(s: AppState, m: number, ano?: number) {
  const a = getAnoBase(s, ano);
  return s.lancamentos
    .filter(
      (l) => !l.anulado && l.competencia?.mes === m && l.competencia?.ano === a,
    )
    .reduce((acc, l) => acc + l.valor, 0);
}

export function despesaMes(s: AppState, m: number, ano?: number) {
  const a = getAnoBase(s, ano);
  const p = `${a}-${String(m).padStart(2, '0')}`;
  return s.despesas
    .filter((d) => !d.anulado && d.data.startsWith(p))
    .reduce((acc, d) => acc + d.valor, 0);
}

export function lancAssocMes(
  s: AppState,
  aid: string,
  m: number,
  ano?: number,
): Lancamento[] {
  const a = getAnoBase(s, ano);
  return s.lancamentos.filter(
    (l) =>
      !l.anulado &&
      l.associadoId === aid &&
      l.competencia?.mes === m &&
      l.competencia?.ano === a,
  );
}

export function totalAssoc(s: AppState, aid: string, ano?: number) {
  const a = getAnoBase(s, ano);
  return s.lancamentos
    .filter((l) => !l.anulado && l.associadoId === aid && l.competencia?.ano === a)
    .reduce((acc, l) => acc + l.valor, 0);
}

export function totalPorTipo(s: AppState, tipo: string, ano?: number) {
  const a = getAnoBase(s, ano);
  return s.lancamentos
    .filter(
      (l) => !l.anulado && l.tipo === tipo && l.competencia?.ano === a,
    )
    .reduce((acc, l) => acc + l.valor, 0);
}

export function inadimplentes(s: AppState, mesRef: number, ano?: number): Associado[] {
  const a = getAnoBase(s, ano);
  return s.associados.filter((as) => {
    if (as.entrada > mesRef) return false;
    return lancAssocMes(s, as.id, mesRef, a).filter((l) => l.tipo === 'mensalidade').length === 0;
  });
}

export function pendenciaAno(s: AppState, a: Associado, mesRef: number) {
  let falta = 0;
  for (let m = a.entrada; m <= mesRef; m++) {
    if (lancAssocMes(s, a.id, m).filter((l) => l.tipo === 'mensalidade').length === 0) falta++;
  }
  return falta;
}

export function getMesRef(s: AppState, ano?: number) {
  const a = getAnoBase(s, ano);
  const h = new Date();
  const cy = h.getFullYear();
  const cm = h.getMonth() + 1;
  if (a < cy) return 12;
  if (a > cy) return 0;
  return cm;
}

export function getAnosDisponiveis(s: AppState): number[] {
  const anos = new Set<number>();
  anos.add(s.config.anoExercicio);
  s.lancamentos.forEach((l) => {
    if (l.competencia?.ano) anos.add(l.competencia.ano);
  });
  s.despesas.forEach((d) => {
    const a = parseInt(d.data.slice(0, 4));
    if (!isNaN(a)) anos.add(a);
  });
  anos.add(s.config.anoExercicio + 1);
  return Array.from(anos).sort((x, y) => x - y);
}