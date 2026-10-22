import type { AppState, Associado, Lancamento } from '../types';

export function receitaTotal(s: AppState) {
  return s.lancamentos.filter((l) => !l.anulado).reduce((a, l) => a + l.valor, 0);
}

export function despesaTotal(s: AppState) {
  return s.despesas.filter((d) => !d.anulado).reduce((a, d) => a + d.valor, 0);
}

export function saldoAtual(s: AppState) {
  return s.config.saldoAbertura + receitaTotal(s) - despesaTotal(s);
}

export function receitaMes(s: AppState, m: number) {
  return s.lancamentos
    .filter((l) => !l.anulado && l.competencia?.mes === m)
    .reduce((a, l) => a + l.valor, 0);
}

export function despesaMes(s: AppState, m: number) {
  const p = `${s.config.anoExercicio}-${String(m).padStart(2, '0')}`;
  return s.despesas
    .filter((d) => !d.anulado && d.data.startsWith(p))
    .reduce((a, d) => a + d.valor, 0);
}

export function lancAssocMes(s: AppState, aid: string, m: number): Lancamento[] {
  return s.lancamentos.filter(
    (l) => !l.anulado && l.associadoId === aid && l.competencia?.mes === m,
  );
}

export function totalAssoc(s: AppState, aid: string) {
  return s.lancamentos
    .filter((l) => !l.anulado && l.associadoId === aid)
    .reduce((a, l) => a + l.valor, 0);
}

export function totalPorTipo(s: AppState, tipo: string) {
  return s.lancamentos
    .filter((l) => !l.anulado && l.tipo === tipo)
    .reduce((a, l) => a + l.valor, 0);
}

export function inadimplentes(s: AppState, mesRef: number): Associado[] {
  return s.associados.filter((a) => {
    if (a.entrada > mesRef) return false;
    return lancAssocMes(s, a.id, mesRef).filter((l) => l.tipo === 'mensalidade').length === 0;
  });
}

export function pendenciaAno(s: AppState, a: Associado, mesRef: number) {
  let falta = 0;
  for (let m = a.entrada; m <= mesRef; m++) {
    if (lancAssocMes(s, a.id, m).filter((l) => l.tipo === 'mensalidade').length === 0) falta++;
  }
  return falta;
}

export function getMesRef(s: AppState) {
  const h = new Date();
  const cy = h.getFullYear();
  const cm = h.getMonth() + 1;
  if (s.config.anoExercicio < cy) return 12;
  if (s.config.anoExercicio > cy) {
    const ms = s.lancamentos.filter((l) => l.competencia).map((l) => l.competencia!.mes);
    return ms.length ? Math.max(...ms) : 0;
  }
  return cm;
}