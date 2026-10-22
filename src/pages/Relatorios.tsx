import { useState } from 'react';
import {
  Card, Table, Select, Button, Space, Row, Col, Statistic, Progress, Tag, App,
} from 'antd';
import { LockOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/useAppStore';
import {
  receitaMes, despesaMes, saldoAtual, getMesRef,
} from '../lib/calculos';
import {
  fmtBR, monthName, months, tipoLabel, categoriaLabel, uid, todayISO, brDate,
} from '../lib/format';
import type { Snapshot } from '../types';

const TIPOS_RECEITA = [
  'mensalidade', 'festa', 'visitante', 'ex-associado', 'rendimento', 'extra',
] as const;

const CATS_DESPESA = ['juiz', 'goleiro', 'bola', 'outras'] as const;

const CORES_TIPO: Record<string, string> = {
  mensalidade: '#1b5e20',
  festa: '#7b1fa2',
  visitante: '#0288d1',
  'ex-associado': '#ef6c00',
  rendimento: '#00897b',
  extra: '#3949ab',
};

const CORES_CAT: Record<string, string> = {
  juiz: '#1565c0',
  goleiro: '#7b1fa2',
  bola: '#e65100',
  outras: '#6b7f6b',
};

export function Relatorios() {
  const { message, modal } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const mesRef = getMesRef(state);
  const [de, setDe] = useState(1);
  const [ate, setAte] = useState(mesRef || 12);
  const [mesFechar, setMesFechar] = useState(mesRef || 1);

  /* ===== FLUXO ===== */
  const fluxo = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter((m) => m >= de && m <= ate)
    .map((m) => {
      const r = receitaMes(state, m);
      const d = despesaMes(state, m);
      return { key: m, m, r, d, liq: r - d };
    });

  let saldoAcum = state.config.saldoAbertura;
  const fluxoComSaldo = fluxo.map((f) => {
    saldoAcum += f.liq;
    return { ...f, saldo: saldoAcum };
  });

  const totRecPeriodo = fluxo.reduce((s, f) => s + f.r, 0);
  const totDespPeriodo = fluxo.reduce((s, f) => s + f.d, 0);

  /* ===== COMPOSIÇÃO RECEITAS ===== */
  const recPorTipo: Record<string, number> = {};
  TIPOS_RECEITA.forEach((t) => (recPorTipo[t] = 0));
  state.lancamentos
    .filter((l) => !l.anulado && l.competencia)
    .filter((l) => l.competencia!.mes >= de && l.competencia!.mes <= ate)
    .forEach((l) => {
      if (recPorTipo[l.tipo] !== undefined) recPorTipo[l.tipo] += l.valor;
    });
  const totalRec = Object.values(recPorTipo).reduce((a, b) => a + b, 0);

  /* ===== COMPOSIÇÃO DESPESAS ===== */
  const despPorCat: Record<string, number> = {};
  CATS_DESPESA.forEach((c) => (despPorCat[c] = 0));
  state.despesas
    .filter((d) => !d.anulado)
    .filter((d) => {
      const m = parseInt(d.data.slice(5, 7));
      return m >= de && m <= ate;
    })
    .forEach((d) => {
      if (despPorCat[d.categoria] !== undefined)
        despPorCat[d.categoria] += d.valor;
    });
  const totalDesp = Object.values(despPorCat).reduce((a, b) => a + b, 0);

  /* ===== FECHAR MÊS ===== */
  const fecharMes = () => {
    const jaExiste = state.snapshots.some(
      (s) => s.mes === mesFechar && s.ano === state.config.anoExercicio,
    );
    if (jaExiste) {
      message.warning(
        'Este mês já foi fechado. Delete o snapshot existente primeiro.',
      );
      return;
    }

    const r = receitaMes(state, mesFechar);
    const d = despesaMes(state, mesFechar);

    modal.confirm({
      title: `Fechar ${monthName(mesFechar)}/${state.config.anoExercicio}?`,
      content: (
        <div style={{ lineHeight: 1.8 }}>
          <p><strong>Receitas:</strong> {fmtBR(r)}</p>
          <p><strong>Despesas:</strong> {fmtBR(d)}</p>
          <p><strong>Líquido:</strong> {fmtBR(r - d)}</p>
          <p><strong>Saldo atual:</strong> {fmtBR(saldoAtual(state))}</p>
          <p style={{ marginTop: 12, color: '#6b7f6b', fontSize: 12 }}>
            O snapshot congela a situação atual do mês. Você pode continuar
            editando o mês depois, mas o snapshot fica imutável para auditoria.
          </p>
        </div>
      ),
      okText: 'Fechar mês',
      cancelText: 'Cancelar',
      onOk: () => {
        const snap: Snapshot = {
          id: uid(),
          mes: mesFechar,
          ano: state.config.anoExercicio,
          receitas: r,
          despesas: d,
          liquido: r - d,
          saldoFinal: saldoAtual(state),
          geradoEm: todayISO(),
        };
        setState((s) => ({ ...s, snapshots: [...s.snapshots, snap] }));
        message.success(`${monthName(mesFechar)} fechado com sucesso`);
      },
    });
  };

  const deletarSnapshot = (id: string) => {
    modal.confirm({
      title: 'Deletar snapshot?',
      content:
        'O mês continua editável, apenas o registro congelado será removido.',
      okText: 'Deletar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => {
        setState((s) => ({
          ...s,
          snapshots: s.snapshots.filter((x) => x.id !== id),
        }));
        message.success('Snapshot removido');
      },
    });
  };

  /* ===== EXPORTAR CSV ===== */
  const exportarFluxoCSV = () => {
    const header = 'mes,receitas,despesas,liquido,saldo_acumulado\n';
    const rows = fluxoComSaldo
      .map(
        (f) =>
          `${monthName(f.m)},${f.r.toFixed(2)},${f.d.toFixed(2)},${f.liq.toFixed(2)},${f.saldo.toFixed(2)}`,
      )
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `baba-gtf-relatorio-${de}-${ate}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    message.success('Relatório exportado');
  };

  /* ===== COLUNAS ===== */
  const fluxoColumns = [
    {
      title: 'Mês',
      dataIndex: 'm',
      render: (m: number) => monthName(m),
    },
    {
      title: 'Receitas',
      dataIndex: 'r',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: '#1b5e20', fontWeight: 600 }}>{fmtBR(v)}</span>
      ),
    },
    {
      title: 'Despesas',
      dataIndex: 'd',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: '#c62828', fontWeight: 600 }}>{fmtBR(v)}</span>
      ),
    },
    {
      title: 'Líquido',
      dataIndex: 'liq',
      align: 'right' as const,
      render: (v: number) => (
        <span
          style={{ color: v >= 0 ? '#1b5e20' : '#c62828', fontWeight: 700 }}
        >
          {fmtBR(v)}
        </span>
      ),
    },
    {
      title: 'Saldo Acumulado',
      dataIndex: 'saldo',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontWeight: 700 }}>{fmtBR(v)}</span>
      ),
    },
  ];

  /* ===== COMPONENTE DE BARRA DE COMPOSIÇÃO ===== */
  const BarraComposicao = ({
    label,
    valor,
    total,
    cor,
  }: {
    label: string;
    valor: number;
    total: number;
    cor: string;
  }) => {
    const pct = total > 0 ? (valor / total) * 100 : 0;
    return (
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span style={{ color: '#6b7f6b' }}>
            <strong style={{ color: cor }}>{fmtBR(valor)}</strong> ·{' '}
            {pct.toFixed(1)}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: '#f0f0f0',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: cor,
              borderRadius: 4,
              transition: 'width .4s',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ===== FILTRO DE PERÍODO ===== */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap align="center">
          <span style={{ fontWeight: 600, color: '#6b7f6b' }}>Período:</span>
          <Select
            value={de}
            onChange={setDe}
            style={{ width: 140 }}
            options={months.map((m, i) => ({ value: i + 1, label: m }))}
          />
          <span style={{ color: '#6b7f6b' }}>até</span>
          <Select
            value={ate}
            onChange={setAte}
            style={{ width: 140 }}
            options={months
              .map((m, i) => ({ value: i + 1, label: m }))
              .filter((o) => o.value >= de)}
          />
          <Button
            onClick={() => {
              setDe(1);
              setAte(mesRef || 12);
            }}
          >
            Resetar
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportarFluxoCSV}
          >
            Exportar CSV
          </Button>
        </Space>
      </Card>

      {/* ===== TOTAIS DO PERÍODO ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Receitas no período"
              value={totRecPeriodo}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: '#1b5e20', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Despesas no período"
              value={totDespPeriodo}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: '#c62828', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Líquido no período"
              value={totRecPeriodo - totDespPeriodo}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{
                color: totRecPeriodo - totDespPeriodo >= 0 ? '#1b5e20' : '#c62828',
                fontSize: 22,
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Saldo em caixa"
              value={saldoAtual(state)}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{
                color: saldoAtual(state) >= 0 ? '#1b5e20' : '#c62828',
                fontSize: 22,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== FLUXO MENSAL ===== */}
      <Card
        title={`📈 Fluxo mensal — ${monthName(de)} a ${monthName(ate)}`}
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={fluxoComSaldo}
          columns={fluxoColumns}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ color: '#1b5e20' }}>
                  {fmtBR(totRecPeriodo)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong style={{ color: '#c62828' }}>
                  {fmtBR(totDespPeriodo)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong
                  style={{
                    color:
                      totRecPeriodo - totDespPeriodo >= 0 ? '#1b5e20' : '#c62828',
                  }}
                >
                  {fmtBR(totRecPeriodo - totDespPeriodo)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong>{fmtBR(saldoAcum)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* ===== COMPOSIÇÕES ===== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="🔍 Composição das receitas">
            {totalRec === 0 ? (
              <p style={{ color: '#6b7f6b', textAlign: 'center', padding: 20 }}>
                Nenhuma receita no período.
              </p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#1b5e20' }}>
                    {fmtBR(totalRec)}
                  </span>
                  <span style={{ color: '#6b7f6b', marginLeft: 8, fontSize: 12 }}>
                    total arrecadado
                  </span>
                </div>
                {TIPOS_RECEITA.map((t) =>
                  recPorTipo[t] > 0 ? (
                    <BarraComposicao
                      key={t}
                      label={tipoLabel[t]}
                      valor={recPorTipo[t]}
                      total={totalRec}
                      cor={CORES_TIPO[t]}
                    />
                  ) : null,
                )}
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🔍 Composição das despesas">
            {totalDesp === 0 ? (
              <p style={{ color: '#6b7f6b', textAlign: 'center', padding: 20 }}>
                Nenhuma despesa no período.
              </p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#c62828' }}>
                    {fmtBR(totalDesp)}
                  </span>
                  <span style={{ color: '#6b7f6b', marginLeft: 8, fontSize: 12 }}>
                    total gasto
                  </span>
                </div>
                {CATS_DESPESA.map((c) =>
                  despPorCat[c] > 0 ? (
                    <BarraComposicao
                      key={c}
                      label={categoriaLabel[c]}
                      valor={despPorCat[c]}
                      total={totalDesp}
                      cor={CORES_CAT[c]}
                    />
                  ) : null,
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* ===== SNAPSHOTS ===== */}
      <Card
        title="🔒 Fechamento de mês (snapshot)"
        extra={
          <Space>
            <Select
              value={mesFechar}
              onChange={setMesFechar}
              style={{ width: 140 }}
              options={months.map((m, i) => ({
                value: i + 1,
                label: m,
              }))}
            />
            <Button
              type="primary"
              icon={<LockOutlined />}
              onClick={fecharMes}
            >
              Fechar mês
            </Button>
          </Space>
        }
      >
        <p style={{ color: '#6b7f6b', fontSize: 13, marginBottom: 16 }}>
          Congela a situação do mês para auditoria. O mês continua editável
          depois, mas o snapshot preserva os números do momento do fechamento.
        </p>

        {state.snapshots.length === 0 ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: '#6b7f6b',
              background: '#f9fbe7',
              borderRadius: 8,
            }}
          >
            Nenhum mês fechado ainda. Use o botão acima para fechar o primeiro.
          </div>
        ) : (
          <Table
            dataSource={[...state.snapshots].sort(
              (a, b) => b.ano - a.ano || b.mes - a.mes,
            )}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Mês',
                key: 'mes',
                render: (_: unknown, s: Snapshot) =>
                  `${monthName(s.mes)}/${s.ano}`,
              },
              {
                title: 'Receitas',
                dataIndex: 'receitas',
                align: 'right',
                render: (v: number) => (
                  <span style={{ color: '#1b5e20' }}>{fmtBR(v)}</span>
                ),
              },
              {
                title: 'Despesas',
                dataIndex: 'despesas',
                align: 'right',
                render: (v: number) => (
                  <span style={{ color: '#c62828' }}>{fmtBR(v)}</span>
                ),
              },
              {
                title: 'Líquido',
                dataIndex: 'liquido',
                align: 'right',
                render: (v: number) => (
                  <strong
                    style={{ color: v >= 0 ? '#1b5e20' : '#c62828' }}
                  >
                    {fmtBR(v)}
                  </strong>
                ),
              },
              {
                title: 'Saldo final',
                dataIndex: 'saldoFinal',
                align: 'right',
                render: (v: number) => <strong>{fmtBR(v)}</strong>,
              },
              {
                title: 'Gerado em',
                dataIndex: 'geradoEm',
                render: (d: string) => (
                  <Tag color="default">{brDate(d)}</Tag>
                ),
              },
              {
                title: '',
                key: 'acao',
                width: 60,
                render: (_: unknown, s: Snapshot) => (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deletarSnapshot(s.id)}
                    title="Deletar snapshot"
                  />
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}