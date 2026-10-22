import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import { useAppStore } from '../store/useAppStore';
import {
  saldoAtual,
  receitaMes,
  despesaMes,
  inadimplentes,
  totalPorTipo,
  getMesRef,
} from '../lib/calculos';
import { fmtBR, monthName, monthShort } from '../lib/format';

export function Dashboard() {
  const state = useAppStore((s) => s.state);
  const mesRef = getMesRef(state);

  const saldo = saldoAtual(state);
  const rec = receitaMes(state, mesRef);
  const des = despesaMes(state, mesRef);
  const liq = rec - des;
  const inad = inadimplentes(state, mesRef);
  const festaPago = totalPorTipo(state, 'festa');
  const meta = state.campanha.meta || 0;
  const pct = meta > 0 ? Math.min(100, (festaPago / meta) * 100) : 0;

  // Série mensal para o gráfico
  const recs = Array.from({ length: 12 }, (_, i) => receitaMes(state, i + 1));
  const desps = Array.from({ length: 12 }, (_, i) => despesaMes(state, i + 1));
  const max = Math.max(...recs, ...desps, 1);

  // Tabela mensal com saldo acumulado
  let acumulado = state.config.saldoAbertura;
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
      {/* ===== CARDS ===== */}
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
              Abertura: {fmtBR(state.config.saldoAbertura)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={`📅 ${monthName(mesRef)} · Líquido`}
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
              sem mensalidade em {monthShort(mesRef)}
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

      {/* ===== GRÁFICO ===== */}
      <Card title="📈 Receitas × Despesas por mês" style={{ marginBottom: 16 }}>
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
        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            marginTop: 12,
            fontSize: 12,
          }}
        >
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#1b5e20',
                marginRight: 6,
              }}
            />
            Receitas
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#c62828',
                marginRight: 6,
              }}
            />
            Despesas
          </span>
        </div>
      </Card>

      {/* ===== VALORES MENSAIS ===== */}
      <Card title="💵 Valores Mensais">
        <Table
          dataSource={tabela}
          columns={[
            {
              title: 'Mês',
              dataIndex: 'm',
              render: (m: number) => monthName(m),
            },
            {
              title: 'Receitas',
              dataIndex: 'r',
              align: 'right',
              render: (v: number) => (
                <span style={{ color: '#1b5e20' }}>{fmtBR(v)}</span>
              ),
            },
            {
              title: 'Despesas',
              dataIndex: 'd',
              align: 'right',
              render: (v: number) => (
                <span style={{ color: '#c62828' }}>{fmtBR(v)}</span>
              ),
            },
            {
              title: 'Líquido',
              dataIndex: 'l',
              align: 'right',
              render: (v: number) => (
                <span
                  style={{
                    color: v >= 0 ? '#1b5e20' : '#c62828',
                    fontWeight: 600,
                  }}
                >
                  {fmtBR(v)}
                </span>
              ),
            },
            {
              title: 'Saldo Acumulado',
              dataIndex: 'acumulado',
              align: 'right',
              render: (v: number) => (
                <span style={{ fontWeight: 700 }}>{fmtBR(v)}</span>
              ),
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>Total</strong>
              </Table.Summary.Cell>
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