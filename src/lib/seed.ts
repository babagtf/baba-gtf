import type { AppState, Associado, Lancamento, Despesa } from '../types';
import { uid } from './format';

export function buildSeed(): AppState {
  const A = (n: number, nome: string, apelido: string, entrada: number): Associado => ({
    id: 'a' + n, nome, apelido, entrada, status: 'ativo',
  });

  const associados: Associado[] = [
    A(1, 'ADRIANO NOBRE', '', 1),
    A(2, 'ALMIR BARBOSA', '', 1),
    A(3, 'ANDERSON SANTIAGO MARINHO', 'VAN DICK', 1),
    A(4, 'ANDERSON SANTOS DE MORAES', 'RASTA', 1),
    A(5, 'ALANDERSON AMOR DIVINO', '', 6),
    A(6, 'BERNARDO', '', 5),
    A(7, 'BRUNO REIS', '', 9),
    A(8, 'CARLOS DANTAS', '', 1),
    A(9, 'DAILSON BARROSO', '', 1),
    A(10, 'DANILTON LEOPOLDO', 'NEYMAR', 8),
    A(11, 'EDSON FREITAS', '', 1),
    A(12, 'EDUARDO MORAES DA CRUZ', '', 1),
    A(13, 'EVERTON RODE', '', 1),
    A(14, 'FABIO DIVINO', '', 1),
    A(15, 'FABIO SANTOS DA SILVA TOSTA', '', 1),
    A(16, 'GABRIEL ABREU', '', 1),
    A(17, 'IGOR LOPES', '', 1),
    A(18, 'JAIR ONOFRE', '', 1),
    A(19, 'JONAS FIUZA', '', 1),
    A(20, 'JORDAN ALMEIDA', '', 1),
    A(21, 'KAUAN DA SILVA', '', 8),
    A(22, 'LEONARDO VITO GOMES DOS SANTOS', 'FILHO DE DAILSON', 1),
    A(23, 'LEONADO HUPSEL', '', 5),
    A(24, 'LUAN SANTANA', '', 1),
    A(25, 'MAIRON ABREU', '', 1),
    A(26, 'MARCOS ADRIANO GOMES DOS SANTOS', '', 1),
    A(27, 'RIZMARIO ARAUJO', '', 1),
    A(28, 'RODRIGO ANDRADE', 'RODADO', 8),
    A(29, 'SAVIO DOS SANTOS', '', 7),
    A(30, 'SYDNEY BATISTA', '', 1),
    A(31, 'THIAGO DANTAS', '', 6),
    A(32, 'VINICIUS LAGO', '', 1),
    A(33, 'VITOR CANTUARIO', '', 1),
  ];

  const lancamentos: Lancamento[] = [];

  const push = (
    tipo: Lancamento['tipo'],
    aid: string | null,
    mes: number,
    valor: number,
    nome?: string,
    obs?: string,
  ) => {
    lancamentos.push({
      id: uid(),
      data: `2026-${String(mes).padStart(2, '0')}-01`,
      tipo,
      associadoId: aid,
      nome: nome ?? null,
      competencia: { mes, ano: 2026 },
      valor,
      formaPagamento: 'pix',
      observacao: obs ?? '',
    });
  };

  // Mensalidades (mapa: id → meses com pagamento)
  const mens: Record<string, number[]> = {
    1: [1, 2, 3, 4, 5, 6, 7, 8],
    2: [1, 2, 3, 4, 5, 6, 7],
    3: [1, 2, 3, 4, 5],
    4: [1, 2, 3],
    5: [6, 7, 8],
    6: [5, 6, 7],
    7: [9, 10],
    8: [1, 2, 3, 4, 5, 6, 7],
    9: [1, 2, 3, 5],
    10: [8, 9],
    11: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    12: [1, 2],
    13: [1, 2, 3, 5, 6, 7, 8, 9, 10],
    14: [1, 2, 4, 5, 6, 7],
    15: [1, 2, 3, 4, 5, 6, 8],
    16: [1, 2, 3, 4],
    17: [1, 2, 3, 4, 5],
    18: [1, 2, 3, 4, 5, 6, 7],
    19: [1, 2],
    20: [1, 2, 3, 4, 5, 6, 7, 8],
    21: [8, 9],
    22: [1, 2, 3],
    23: [5, 6, 7, 8],
    24: [1, 2, 3, 4, 5, 6],
    25: [1, 2, 3, 4, 5],
    26: [1],
    27: [1, 2, 3, 4, 5, 6],
    29: [7, 8, 9, 10],
    30: [1, 2, 3, 4, 5, 6, 7],
    31: [6, 7, 8, 9],
    32: [1, 2, 3, 4, 5, 6],
    33: [1, 2, 3, 4, 5, 6],
  };
  for (const aid in mens) {
    for (const m of mens[aid]) {
      push('mensalidade', 'a' + aid, m, aid === '22' ? 20 : 30);
    }
  }

  // Casos especiais da planilha (decomposição de valores compostos)
  ['1ª parcela', '2ª parcela', '3ª parcela'].forEach((o) =>
    push('mensalidade', 'a14', 3, 10, undefined, o),
  );
  push('mensalidade', 'a13', 4, 20, undefined, 'Valor divergente — conferir');
  push('mensalidade', 'a11', 10, 30);
  push('extra', 'a11', 10, 120, undefined, 'Adiantamento/extra');
  push('mensalidade', 'a20', 10, 59.9, undefined, 'Valor divergente — conferir');
  push('extra', 'a23', 9, 120, undefined, 'Adiantamento');

  // Festa/Confra (do 60 = mensalidade + festa)
  const festa: Record<string, number[]> = {
    2: [8, 9, 10],
    8: [8, 9, 10],
    14: [8, 9],
    18: [8, 9],
    20: [9],
    24: [7, 8, 9],
    27: [7, 8, 9],
    28: [8],
    30: [8, 9, 10],
    32: [7, 8, 9],
  };
  for (const aid in festa) {
    for (const m of festa[aid]) push('festa', 'a' + aid, m, 30);
  }

  // Visitantes (totais por mês, lote migrado)
  const visit: [number, number][] = [
    [1, 15], [2, 75], [3, 240], [4, 166], [5, 225],
    [6, 45], [7, 135], [8, 105], [9, 45], [10, 75],
  ];
  for (const [mes, val] of visit) {
    push('visitante', null, mes, val, 'Visitantes de ' + mes);
  }

  // Ex-associados e rendimento
  push('ex-associado', null, 1, 120, 'Ex-associados jan');
  push('ex-associado', null, 2, 60, 'Ex-associados fev');
  push('rendimento', null, 2, 1.58, 'Rendimento');

  // Despesas
  const rawDespesas: [string, Despesa['categoria'], number, string][] = [
    ['2026-02-01', 'juiz', 180, '2 jogos'],
    ['2026-03-01', 'juiz', 450, '5 jogos'],
    ['2026-04-01', 'juiz', 450, '5 jogos'],
    ['2026-05-01', 'juiz', 320, '3x90 + 50'],
    ['2026-06-01', 'juiz', 100, '2x50'],
    ['2026-07-01', 'juiz', 410, 'múltiplos'],
    ['2026-08-01', 'juiz', 310, 'múltiplos'],
    ['2026-09-01', 'juiz', 360, '4x90'],
    ['2026-10-01', 'juiz', 270, '3x90'],
    ['2026-02-01', 'goleiro', 30, ''],
    ['2026-03-01', 'goleiro', 280, ''],
    ['2026-04-01', 'goleiro', 340, ''],
    ['2026-05-01', 'goleiro', 170, ''],
    ['2026-06-01', 'goleiro', 40, ''],
    ['2026-07-01', 'goleiro', 250, ''],
    ['2026-08-01', 'goleiro', 300, ''],
    ['2026-09-01', 'goleiro', 480, ''],
    ['2026-10-01', 'goleiro', 360, ''],
    ['2026-02-01', 'outras', 1300, 'Migrado'],
    ['2026-05-01', 'outras', 790, ''],
    ['2026-07-01', 'outras', 180, ''],
  ];
  const despesas: Despesa[] = rawDespesas.map(([data, categoria, valor, observacao]) => ({
    id: uid(),
    data,
    categoria,
    descricao: '',
    valor,
    observacao,
  }));

  return {
    config: {
      pin: '2026',
      mensalidadePadrao: 30,
      valorFesta: 30,
      saldoAbertura: 163.66,
      anoExercicio: 2026,
    },
    campanha: {
      nome: 'Festa/Confra 2026',
      meta: 0,
      valorSugerido: 30,
    },
    associados,
    lancamentos,
    despesas,
    snapshots: [],
  };
}