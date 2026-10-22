import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import { useAppStore } from '../store/useAppStore';
import {
  saldoAtual,
  receitaMes,
  despesaMes,
  inadimplentes,
  totalPorTipo,
  getMesRef,
  calcularAberturaAno,
} from '../lib/calculos';
import { fmtBR, monthName, monthShort } from '../lib/format';

export function Dashboard() {
  const state = useAppStore((s) => s.state);
  const ano = state.config.anoExercicio;
  const mesRef = getMesRef(state);

  const saldo = saldoAtual(state);
  const rec = receitaMes(state, mesRef);
  const des = despesaMes(state, mesRef);
  const liq = rec - des;
  const inad = inadimplentes(state, mesRef);
  const festaPago = totalPorTipo(state, 'festa');
  const meta = state.campanha.meta || 0;
  const pct = meta > 0 ? Math.min(100, (festaPago / meta) * 100) : 0;

  const recs = Array.from({ length: 12 }, (_, i) => receitaMes(state, i + 1));
  const desps = Array.from({ length: 12 }, (_, i) => despesaMes(state, i + 1));
  const max = Math.max(...recs, ...desps, 1);

  let acumulado = calcularAberturaAno(state, ano);
  const tabela = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const r = recs[i];
    const d = desps[i];
    const l = r - d;
    acumulado += l;
    return { key: m, m, r, d, l, acumulado };
  });

  const totR = recs.reduce((a, b) => a + b, 0);
  const totD = desps.reduce((a, b) => a + b, 0);

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="💰 Saldo em Caixa"
              value={saldo}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: saldo >= 0 ? '#1b5e20' : '#c62828' }}
            />
            <div style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              Abertura: {fmtBR(calcularAberturaAno(state, ano))}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={`📅 ${monthName(mesRef)}/${ano} · Líquido`}
              value={liq}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: liq >= 0 ? '#1b5e20' : '#c62828' }}
            />
            <div style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              +{fmtBR(rec)} · −{fmtBR(des)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="⚠️ Em Aberto"
              value={inad.length}
              valueStyle={{ color: inad.length > 0 ? '#ef6c00' : '#1b5e20' }}
            />
            <div style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              sem mensalidade em {monthShort(mesRef)}/{ano}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="🏆 Confra"
              value={festaPago}
              formatter={(v) => fmtBR(Number(v))}
              valueStyle={{ color: '#7b1fa2' }}
            />
            <div style={{ fontSize: 11, color: '#6b7f6b', marginTop: 6 }}>
              {meta > 0
                ? `Meta ${fmtBR(meta)} · ${pct.toFixed(0)}%`
                : 'Meta não definida ainda'}
            </div>
            {meta > 0 && (
              <Progress
                percent={pct}
                showInfo={false}
                strokeColor="#7b1fa2"
                size="small"
                style={{ marginTop: 4 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title={`📈 Receitas × Despesas por mês (${ano})`} style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            height: 260,
            alignItems: 'flex-end',
            padding: '16px 0 0',
            borderBottom: '2px solid #dcedc8',
          }}
        >
          {recs.map((r, i) => {
            const d = desps[i];
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    title={`${monthName(i + 1)}: +${fmtBR(r)}`}
                    style={{
                      width: '42%',
                      height: `${(r / max) * 100}%`,
                      background: 'linear-gradient(180deg, #4caf50, #1b5e20)',
                      borderRadius: '3px 3px 0 0',
                      minHeight: 2,
                      transition: 'height .3s',
                    }}
                  />
                  <div
                    title={`${monthName(i + 1)}: −${fmtBR(d)}`}
                    style={{
                      width: '42%',
                      height: `${(d / max) * 100}%`,
                      background: 'linear-gradient(180deg, #ef5350, #c62828)',
                      borderRadius: '3px 3px 0 0',
                      minHeight: 2,
                      transition: 'height .3s',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#6b7f6b',
                    fontWeight: 700,
                    marginTop: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  {monthShort(i + 1)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={`💵 Valores Mensais (${ano})`}>
        <Table
          dataSource={tabela}
          columns={[
            { title: 'Mês', dataIndex: 'm', render: (m: number) => monthName(m) },
            {
              title: 'Receitas',
              dataIndex: 'r',
              align: 'right',
              render: (v: number) => <span style={{ color: '#1b5e20' }}>{fmtBR(v)}</span>,
            },
            {
              title: 'Despesas',
              dataIndex: 'd',
              align: 'right',
              render: (v: number) => <span style={{ color: '#c62828' }}>{fmtBR(v)}</span>,
            },
            {
              title: 'Líquido',
              dataIndex: 'l',
              align: 'right',
              render: (v: number) => (
                <span style={{ color: v >= 0 ? '#1b5e20' : '#c62828', fontWeight: 600 }}>
                  {fmtBR(v)}
                </span>
              ),
            },
            {
              title: 'Saldo Acumulado',
              dataIndex: 'acumulado',
              align: 'right',
              render: (v: number) => <span style={{ fontWeight: 700 }}>{fmtBR(v)}</span>,
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ color: '#1b5e20' }}>{fmtBR(totR)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong style={{ color: '#c62828' }}>{fmtBR(totD)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong style={{ color: totR - totD >= 0 ? '#1b5e20' : '#c62828' }}>
                  {fmtBR(totR - totD)}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong>{fmtBR(acumulado)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </>
  );
}