import { useState, useMemo } from 'react';
import {
  Card, Table, Input, Select, Button, Space, Tag, Modal, DatePicker, Switch, Tabs, App,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { fmtBR, brDate, tipoLabel, monthShort, months } from '../lib/format';
import type { Lancamento } from '../types';
import { LancamentoEditModal } from '../components/LancamentoEditModal';
import { AuditBadges } from '../components/AuditBadges';
import { getAuditFields, getAnularFields } from '../lib/audit';
import { useSessionState } from '../hooks/useSessionState';

const TIPOS: Lancamento['tipo'][] = [
  'mensalidade',
  'festa',
  'visitante',
  'ex-associado',
  'rendimento',
  'extra',
];

const CORES_TAG: Record<string, string> = {
  mensalidade: 'green',
  festa: 'purple',
  visitante: 'default',
  'ex-associado': 'orange',
  rendimento: 'cyan',
  extra: 'geekblue',
};

export function Lancamentos() {
  const { message } = App.useApp();
  const state = useAppStore((s) => s.state);
  const setState = useAppStore((s) => s.setState);

  const [q, setQ] = useSessionState('lanc_q', '');
  const [mesFiltro, setMesFiltro] = useSessionState<string>('lanc_mes', 'todos');
  const [formaFiltro, setFormaFiltro] = useSessionState('lanc_forma', 'todas');
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs] | null>(null);
  const [showAnulados, setShowAnulados] = useSessionState('lanc_anulados', false);
  const [tabAtiva, setTabAtiva] = useSessionState<'todos' | Lancamento['tipo']>('lanc_tab', 'todos');

  const [editando, setEditando] = useState<Lancamento | 'novo' | null>(null);
  const [initialTipo, setInitialTipo] = useState<Lancamento['tipo'] | undefined>();
  const [anulando, setAnulando] = useState<Lancamento | null>(null);
  const [motivo, setMotivo] = useState('');
  const [recibo, setRecibo] = useState<Lancamento | null>(null);

  const baseFiltrada = useMemo(() => {
    return state.lancamentos.filter((l) => {
      if (!showAnulados && l.anulado) return false;
      if (l.competencia && l.competencia.ano !== state.config.anoExercicio) return false;
      if (mesFiltro !== 'todos' && l.competencia?.mes !== parseInt(mesFiltro))
        return false;
      if (formaFiltro !== 'todas' && l.formaPagamento !== formaFiltro)
        return false;
      if (periodo) {
        if (
          l.data < periodo[0].format('YYYY-MM-DD') ||
          l.data > periodo[1].format('YYYY-MM-DD')
        )
          return false;
      }
      if (q) {
        const assoc = l.associadoId
          ? state.associados.find((a) => a.id === l.associadoId)
          : null;
        const convidador = l.convidadorId
          ? state.associados.find((a) => a.id === l.convidadorId)
          : null;
        const nome = (assoc?.nome || l.nome || '').toLowerCase();
        const obs = (l.observacao || '').toLowerCase();
        const nomeConvid = (convidador?.nome || '').toLowerCase();
        const ql = q.toLowerCase();
        if (
          !nome.includes(ql) &&
          !obs.includes(ql) &&
          !nomeConvid.includes(ql)
        )
          return false;
      }
      return true;
    });
  }, [state, q, mesFiltro, formaFiltro, periodo, showAnulados]);

  const statsPorTipo = useMemo(() => {
    const r: Record<string, { count: number; total: number }> = {
      todos: { count: 0, total: 0 },
    };
    TIPOS.forEach((t) => (r[t] = { count: 0, total: 0 }));
    baseFiltrada.forEach((l) => {
      r.todos.count++;
      if (!l.anulado) r.todos.total += l.valor;
      if (r[l.tipo]) {
        r[l.tipo].count++;
        if (!l.anulado) r[l.tipo].total += l.valor;
      }
    });
    return r;
  }, [baseFiltrada]);

  const limparFiltros = () => {
    setQ('');
    setMesFiltro('todos');
    setFormaFiltro('todas');
    setPeriodo(null);
    setShowAnulados(false);
    setTabAtiva('todos');
  };

  const abrirNovo = (tipo?: Lancamento['tipo']) => {
    setInitialTipo(tipo);
    setEditando('novo');
  };

  const anular = () => {
    if (!anulando || motivo.trim().length < 3) {
      message.error('Motivo obrigatório (mín. 3 caracteres)');
      return;
    }
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((l) =>
        l.id === anulando.id
          ? {
              ...l,
              anulado: true,
              ...getAnularFields(),
              motivoAnulacao: motivo.trim(),
            }
          : l,
      ),
    }));
    message.success('Lançamento anulado');
    setAnulando(null);
    setMotivo('');
  };

  const reativar = (l: Lancamento) => {
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((x) =>
        x.id === l.id
          ? {
              ...x,
              anulado: false,
              anuladoEm: undefined,
              motivoAnulacao: undefined,
              ...getAuditFields(),
            }
          : x,
      ),
    }));
    message.success('Lançamento reativado');
  };

  const exportarCSV = () => {
    const escopo = baseFiltrada.filter((l) =>
      tabAtiva === 'todos' ? true : l.tipo === tabAtiva,
    );
    const rows = escopo
      .sort((a, b) => b.data.localeCompare(a.data))
      .map((l) => {
        const assoc = l.associadoId
          ? state.associados.find((a) => a.id === l.associadoId)
          : null;
        const convidador = l.convidadorId
          ? state.associados.find((a) => a.id === l.convidadorId)
          : null;
        const nome = assoc?.nome || l.nome || '';
        const comp = l.competencia
          ? `${l.competencia.mes}/${l.competencia.ano}`
          : '';
        return [
          l.data,
          l.tipo,
          `"${nome}"`,
          `"${convidador?.nome || ''}"`,
          comp,
          l.valor,
          l.formaPagamento || '',
          `"${(l.observacao || '').replace(/"/g, '""')}"`,
          l.anulado ? 'SIM' : 'NÃO',
        ].join(',');
      });
    const csv =
      'data,tipo,associado,convidado_por,competencia,valor,forma,observacao,anulado\n' +
      rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `baba-gtf-${tabAtiva}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    message.success(`${escopo.length} lançamentos exportados`);
  };

  const columns: any[] = [
    {
      title: 'Data',
      dataIndex: 'data',
      width: 100,
      render: (d: string) => brDate(d),
    },
    ...(tabAtiva === 'todos'
      ? [
          {
            title: 'Tipo',
            dataIndex: 'tipo',
            width: 130,
            render: (t: string) => (
              <Tag color={CORES_TAG[t]}>{tipoLabel[t]}</Tag>
            ),
          },
        ]
      : []),
    {
      title: 'Nome',
      key: 'nome',
      render: (_: unknown, l: Lancamento) => {
        const assoc = l.associadoId
          ? state.associados.find((a) => a.id === l.associadoId)
          : null;
        return (
          <span>
            <span style={{ textDecoration: l.anulado ? 'line-through' : 'none' }}>
              {assoc?.nome || l.nome || '—'}
            </span>
            <AuditBadges item={l} />
          </span>
        );
      },
    },
    ...(tabAtiva === 'visitante'
      ? [
          {
            title: 'Convidado por',
            key: 'convidador',
            width: 180,
            render: (_: unknown, l: Lancamento) => {
              const c = l.convidadorId
                ? state.associados.find((a) => a.id === l.convidadorId)
                : null;
              return c ? (
                <span style={{ fontWeight: 600, color: '#1b5e20' }}>
                  {c.nome}
                </span>
              ) : (
                <span style={{ color: '#aaa', fontSize: 11 }}>
                  — (legado)
                </span>
              );
            },
          },
        ]
      : []),
    {
      title: 'Comp.',
      key: 'comp',
      width: 90,
      render: (_: unknown, l: Lancamento) =>
        l.competencia
          ? `${monthShort(l.competencia.mes)}/${String(l.competencia.ano).slice(2)}`
          : '—',
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      width: 110,
      align: 'right' as const,
      render: (v: number, l: Lancamento) => (
        <span
          style={{
            color: l.anulado ? '#999' : '#1b5e20',
            fontWeight: 700,
            textDecoration: l.anulado ? 'line-through' : 'none',
          }}
        >
          {fmtBR(v)}
        </span>
      ),
    },
    {
      title: 'Forma',
      dataIndex: 'formaPagamento',
      width: 100,
      render: (v: string) => v || '—',
    },
    {
      title: 'Obs',
      dataIndex: 'observacao',
      render: (o: string) => (
        <span style={{ fontSize: 11 }}>{o || '—'}</span>
      ),
    },
    {
      title: '',
      key: 'acoes',
      width: 140,
      render: (_: unknown, l: Lancamento) => (
        <Space size="small">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => setRecibo(l)}
            title="Recibo"
          />
          {l.anulado ? (
            <Button size="small" onClick={() => reativar(l)} title="Reativar">
              ↩️
            </Button>
          ) : (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditando(l)}
                title="Editar"
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setAnulando(l)}
                title="Anular"
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  const renderTabContent = () => {
    const data =
      tabAtiva === 'todos'
        ? [...baseFiltrada].sort((a, b) => b.data.localeCompare(a.data))
        : baseFiltrada.filter((l) => l.tipo === tabAtiva);

    const stats = statsPorTipo[tabAtiva];

    if (data.length === 0) {
      return (
        <div
          style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7f6b' }}
        >
          Nenhum lançamento nesta categoria
          {q || mesFiltro !== 'todos' || formaFiltro !== 'todas' || periodo ? (
            <>
              {' '}
              com os filtros atuais.{' '}
              <Button type="link" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </>
          ) : (
            '.'
          )}
        </div>
      );
    }

    return (
      <Card
        style={{ marginTop: 8 }}
        title={
          <Space>
            <span>
              {tabAtiva === 'todos'
                ? '📄 Todos os lançamentos'
                : `📂 ${tipoLabel[tabAtiva]}`}
            </span>
            <Tag color="success" style={{ fontSize: 13, padding: '2px 10px' }}>
              {fmtBR(stats.total)}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <span style={{ color: '#6b7f6b', fontSize: 12 }}>
              {data.length} linha{data.length !== 1 ? 's' : ''}
            </span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() =>
                abrirNovo(tabAtiva === 'todos' ? undefined : tabAtiva)
              }
            >
              Novo
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={tabAtiva === 'todos' ? data.slice(0, 500) : data}
          columns={columns}
          rowKey="id"
          pagination={
            tabAtiva === 'todos' || data.length > 30
              ? { pageSize: 30, showSizeChanger: false }
              : false
          }
          size="small"
          scroll={{ x: 'max-content' }}
          rowClassName={(l) => (l.anulado ? 'row-anulada' : '')}
        />
        {tabAtiva === 'todos' && data.length > 500 && (
          <p style={{ color: '#6b7f6b', fontSize: 11, marginTop: 8 }}>
            Mostrando 500 de {data.length}. Use uma aba específica ou refine os
            filtros para ver menos.
          </p>
        )}
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'todos',
      label: (
        <span>
          📄 Todos{' '}
          <span style={{ color: '#6b7f6b', fontWeight: 400 }}>
            ({statsPorTipo.todos.count})
          </span>
        </span>
      ),
    },
    ...TIPOS.map((t) => ({
      key: t,
      label: (
        <span>
          {tipoLabel[t]}{' '}
          <span style={{ color: '#6b7f6b', fontWeight: 400 }}>
            ({statsPorTipo[t]?.count ?? 0})
          </span>
        </span>
      ),
    })),
  ];

  return (
    <>
      <Card
        title={`💰 Lançamentos (${state.lancamentos.length})`}
        extra={
          <Button icon={<ExportOutlined />} onClick={exportarCSV}>
            CSV
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Space wrap style={{ width: '100%' }}>
          <Input.Search
            placeholder="🔎 Nome, convidador ou observação"
            allowClear
            style={{ width: 260 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={mesFiltro}
            onChange={setMesFiltro}
            style={{ width: 150 }}
            options={[
              { value: 'todos', label: 'Todos os meses' },
              ...months.map((m, i) => ({ value: String(i + 1), label: m })),
            ]}
          />
          <Select
            value={formaFiltro}
            onChange={setFormaFiltro}
            style={{ width: 160 }}
            options={[
              { value: 'todas', label: 'Todas as formas' },
              { value: 'pix', label: 'PIX' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'transferencia', label: 'Transferência' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          <DatePicker.RangePicker
            value={periodo}
            onChange={(v) => setPeriodo((v as [Dayjs, Dayjs]) || null)}
            format="DD/MM/YYYY"
            placeholder={['De', 'Até']}
          />
          <Space>
            <Switch
              size="small"
              checked={showAnulados}
              onChange={setShowAnulados}
            />
            <span style={{ fontSize: 12, color: '#6b7f6b' }}>
              Mostrar anulados
            </span>
          </Space>
          <Button onClick={limparFiltros}>Limpar</Button>
        </Space>
      </Card>

      <Tabs
        activeKey={tabAtiva}
        onChange={(k) => setTabAtiva(k as typeof tabAtiva)}
        items={tabItems}
        destroyInactiveTabPane
        style={{
          background: '#fff',
          padding: '0 16px 16px',
          borderRadius: 8,
        }}
      />

      {renderTabContent()}

      {editando && (
        <LancamentoEditModal
          lancamento={editando === 'novo' ? null : editando}
          initialTipo={editando === 'novo' ? initialTipo : undefined}
          onClose={() => {
            setEditando(null);
            setInitialTipo(undefined);
          }}
        />
      )}

      {anulando && (
        <Modal
          open
          onCancel={() => {
            setAnulando(null);
            setMotivo('');
          }}
          onOk={anular}
          title="Anular lançamento"
          okText="Anular"
          okButtonProps={{ danger: true }}
          cancelText="Cancelar"
        >
          <p style={{ marginBottom: 8 }}>
            Motivo da anulação (obrigatório, mín. 3 caracteres):
          </p>
          <Input.TextArea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: pagamento duplicado, erro de digitação, estorno…"
            rows={3}
            autoFocus
          />
        </Modal>
      )}

      {recibo && (
        <Modal
          open
          onCancel={() => setRecibo(null)}
          title="📱 Recibo"
          footer={[
            <Button key="close" onClick={() => setRecibo(null)}>
              Fechar
            </Button>,
            <Button
              key="copy"
              type="primary"
              onClick={() => {
                navigator.clipboard.writeText(gerarTextoRecibo(recibo, state));
                message.success('Recibo copiado');
              }}
            >
              📋 Copiar para WhatsApp
            </Button>,
          ]}
        >
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 13,
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              lineHeight: 1.6,
            }}
          >
            {gerarTextoRecibo(recibo, state)}
          </pre>
        </Modal>
      )}
    </>
  );
}

function gerarTextoRecibo(l: Lancamento, state: any): string {
  const assoc = l.associadoId
    ? state.associados.find((a: any) => a.id === l.associadoId)
    : null;
  const convidador = l.convidadorId
    ? state.associados.find((a: any) => a.id === l.convidadorId)
    : null;
  const nome = assoc
    ? `${assoc.nome}${assoc.apelido ? ` (${assoc.apelido})` : ''}`
    : l.nome || 'Visitante';
  const comp = l.competencia
    ? `${months[l.competencia.mes - 1]}/${l.competencia.ano}`
    : '—';
  const convLinha = convidador ? `👥 Convidado de: ${convidador.nome}\n` : '';
  return `⚽ *BABA GTF — RECIBO*
━━━━━━━━━━━━━━━━━━━
*${nome}*
${convLinha}${tipoLabel[l.tipo]}
Competência: ${comp}
*${fmtBR(l.valor)}*
Pago em: ${brDate(l.data)}
${l.observacao ? `${l.observacao}\n` : ''}━━━━━━━━━━━━━━━━━━━
Pagamento confirmado.
Obrigado!`;
}